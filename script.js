import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBRtcHMJJj-WD86E41ZVS3cm2ggQHyPYnI",
  authDomain: "photog-457a1.firebaseapp.com",
  projectId: "photog-457a1",
  storageBucket: "photog-457a1.appspot.com",
  messagingSenderId: "568507243860",
  appId: "1:568507243860:web:f9a7128c3e703aa79c3cc1",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ელემენტები
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const registerBtn = document.getElementById("register");
const loginBtn = document.getElementById("login");
const logoutBtn = document.getElementById("logoutBtn");
const openCameraBtn = document.getElementById("openCamera");
const snapBtn = document.getElementById("snap");
const switchCameraBtn = document.getElementById("switchCameraBtn");
const video = document.getElementById("video");
const filterSelect = document.getElementById("filterSelect");
const photoText = document.getElementById("photoText");
const photoFeed = document.getElementById("photoFeed");
const cameraSection = document.getElementById("cameraSection");
const userActions = document.getElementById("userActions");
const authSection = document.getElementById("authSection");
const closeCameraBtn = document.getElementById("closeCamera");

// ბურგერ მენიუ და მოდალი
const burgerBtn = document.getElementById("burgerBtn");
const navMenu = document.getElementById("navMenu");
const navLinks = navMenu.querySelectorAll("a[data-title][data-content]");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalContent = document.getElementById("modalContent");
const closeModalBtn = document.getElementById("closeModalBtn");

let stream = null;
let currentFacingMode = "user";

// ბურგერ მენიუს მართვა
burgerBtn.addEventListener("click", () => {
  navMenu.classList.toggle("active");
});
burgerBtn.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    navMenu.classList.toggle("active");
  }
});

// მოდალის გახსნა ბურგერ მენიუს ლინკებზე
navLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const title = link.getAttribute("data-title");
    const content = link.getAttribute("data-content");
    modalTitle.innerHTML = title;
    modalContent.innerHTML = content;
    modalOverlay.classList.add("show");
    navMenu.classList.remove("active");
  });
});

// მოდალის დახურვა ღილაკით და ფონის დაჭერით
closeModalBtn.addEventListener("click", () => {
  modalOverlay.classList.remove("show");
});
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.classList.remove("show");
  }
});

// კამერის ჩართვა
async function startCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentFacingMode }
    });
    video.srcObject = stream;
    video.style.filter = filterSelect.value || "none";
    video.classList.toggle("mirror", currentFacingMode === "user");

    cameraSection.classList.remove("hidden");
    authSection.classList.add("hidden");
    userActions.classList.add("hidden");
    photoFeed.classList.add("hidden");
  } catch (e) {
    alert("კამერის ჩართვა ვერ მოხერხდა: " + e.message);
  }
}

// კამერის გამორთვა
function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  cameraSection.classList.add("hidden");
  photoText.value = "";

  authSection.classList.remove("hidden");
  userActions.classList.add("hidden");
  photoFeed.classList.add("hidden");
}

// ფილტრის ცვლილება ვიდეოზე
filterSelect.addEventListener("change", () => {
  video.style.filter = filterSelect.value || "none";
});

// კამერის გადართვა
switchCameraBtn.addEventListener("click", () => {
  currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
  startCamera();
});

// გადაღება და ატვირთვა (არ ხდება გვერდის გადატვირთვა)
snapBtn.addEventListener("click", async () => {
  if (!stream) {
    alert("გთხოვთ, ჩართოთ კამერა");
    return;
  }
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    alert("ვიდეო ჯერ არ არის მზად, სცადე ცოტა მოგვიანებით");
    return;
  }
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.filter = filterSelect.value || "none";
  if (currentFacingMode === "user") {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imgData = canvas.toDataURL("image/jpeg", 0.8);
  const user = auth.currentUser;
  if (!user) {
    alert("გთხოვთ, გაიაროთ ავტორიზაცია");
    return;
  }
  try {
    await setDoc(doc(db, "photos", user.uid), {
      uid: user.uid,
      email: user.email,
      photo: imgData,
      text: photoText.value.trim(),
      timestamp: serverTimestamp()
    });
    photoText.value = "";
    stopCamera();
    renderPhotoFeed();
    userActions.classList.remove("hidden");
    photoFeed.classList.remove("hidden");
    authSection.classList.add("hidden");
    photoFeed.scrollIntoView({ behavior: "smooth" });
  } catch (e) {
    alert("ატვირთვის შეცდომა: " + e.message);
  }
});

// რეგისტრაცია
registerBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) {
    alert("გთხოვთ, შეიყვანეთ ელ. ფოსტა და პაროლი");
    return;
  }
  createUserWithEmailAndPassword(auth, email, password).catch(e => alert("რეგისტრაციის შეცდომა: " + e.message));
});

// შესვლა
loginBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) {
    alert("გთხოვთ, შეიყვანეთ ელ. ფოსტა და პაროლი");
    return;
  }
  signInWithEmailAndPassword(auth, email, password).catch(e => alert("შესვლის შეცდომა: " + e.message));
});

// გასვლა
logoutBtn.addEventListener("click", (e) => {
  e.preventDefault();
  signOut(auth).then(() => {
    // UI განახლება ავტორიზაციის ცვლილების შემდეგ ხდება onAuthStateChanged-ში
  }).catch(e => alert("გასვლის შეცდომა: " + e.message));
});

// ავტორიზაციის მდგომარეობის კონტროლი
onAuthStateChanged(auth, user => {
  if (user) {
    authSection.classList.add("hidden");
    userActions.classList.remove("hidden");
    photoFeed.classList.remove("hidden");
    renderPhotoFeed();
  } else {
    authSection.classList.remove("hidden");
    userActions.classList.add("hidden");
    photoFeed.classList.add("hidden");
    stopCamera();
    photoFeed.innerHTML = "";
  }
});

// ფოტოების ჩვენება
function renderPhotoFeed() {
  const q = query(collection(db, "photos"), orderBy("timestamp", "desc"));
  onSnapshot(q, snapshot => {
    photoFeed.innerHTML = "";
    snapshot.forEach(doc => {
      const d = doc.data();
      const date = d.timestamp?.toDate ? d.timestamp.toDate() : new Date();
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${d.photo}" alt="ფოტო" />
        <p>${d.text || ""}</p>
        <small>${d.email} | ${date.toLocaleString()}</small>
      `;
      photoFeed.appendChild(card);
    });
  });
}

// UI მართვა
openCameraBtn.addEventListener("click", () => startCamera());
closeCameraBtn.addEventListener("click", () => stopCamera());
