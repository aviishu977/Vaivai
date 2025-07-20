import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
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

const burgerBtn = document.getElementById("burgerBtn");
const navMenu = document.getElementById("navMenu");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalContent = document.getElementById("modalContent");
const closeModalBtn = document.getElementById("closeModalBtn");

let stream = null;
let currentFacingMode = "user";

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

    snapBtn.disabled = true;

    video.addEventListener('loadedmetadata', () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        snapBtn.disabled = false;
      }
    }, { once: true });

    cameraSection.classList.remove("hidden");
    authSection.classList.add("hidden");
    userActions.classList.add("hidden");
    photoFeed.classList.add("hidden");
    openCamera.classList.add("hidden");
    snap.classList.remove("hidden");
  } catch (e) {
    alert("კამერის ჩართვა ვერ მოხერხდა: " + e.message);
  }
}

// კამერის დახურვა
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
  openCamera.classList.remove("hidden");
    snap.classList.add("hidden");
  
}

// ფილტრის ცვლილება ვიდეოზე
filterSelect.addEventListener("change", () => {
  video.style.filter = filterSelect.value || "none";
});

// კამერის შეცვლა (წინა/უკანა)
switchCameraBtn.addEventListener("click", () => {
  currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
  startCamera();
});

// სელფის გადაღება და ატვირთვა
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
    // UI განახლება onAuthStateChanged-ში ხდება
  }).catch(e => alert("გასვლის შეცდომა: " + e.message));
});

// ავტორიზაციის სტატუსის ცვლილების შემსმენელი
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

// ფოტოების გადმოცემა UI-ში
function renderPhotoFeed() {
  const photosCol = collection(db, "photos");
  onSnapshot(photosCol, snapshot => {
    photoFeed.innerHTML = "";
    snapshot.forEach(doc => {
      const d = doc.data();
      const date = d.timestamp?.toDate ? d.timestamp.toDate() : new Date();
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${d.photo}" alt="ფოტო" />
        <p>${d.text || ""}</p>
        <small class="meta">${d.email} | ${getRelativeTime(date)}</small>
      `;
      photoFeed.appendChild(card);
    });
  });
}

// დროზე დამყარებული ტექსტის გამოთვლა
function getRelativeTime(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "ახლახანს";
  if (diff < 3600) return `${Math.floor(diff / 60)} წუთის წინ`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} საათის წინ`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} დღის წინ`;
  return date.toLocaleDateString();
}

// კამერის ღილაკი
openCameraBtn.addEventListener("click", () => startCamera());

// ბურგერის ღილაკის კლიკი - ნავიგაციის გახსნა/დახურვა
burgerBtn.addEventListener("click", () => {
  navMenu.classList.toggle("active");
});

// ნავიგაციის ლინკების კლიკი - მოდალის გახსნა შესაბამისი data ატრიბუტებით
navMenu.addEventListener("click", (event) => {
  const target = event.target;
  if (target.tagName === "A" && target.dataset.title && target.dataset.content) {
    event.preventDefault();
    modalTitle.textContent = target.dataset.title;
    modalContent.innerHTML = target.dataset.content;
    modalOverlay.classList.add("show");
  }
});

// მოდალის დახურვის ღილაკი
closeModalBtn.addEventListener("click", () => {
  modalOverlay.classList.remove("show");
});

// კლიკი მოდალის ბექგრაუნდზე დახურვისათვის
modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) {
    modalOverlay.classList.remove("show");
  }
});
