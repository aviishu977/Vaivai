// =============================
// Firebase Imports
// =============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  onSnapshot,
  updateDoc,
  getDoc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// =============================
// Firebase Config
// =============================
const firebaseConfig = {
  apiKey: "AIzaSyBRtcHMJJj-WD86E41ZVS3cm2ggQHyPYnI",
  authDomain: "photog-457a1.firebaseapp.com",
  projectId: "photog-457a1",
  storageBucket: "photog-457a1.appspot.com",
  messagingSenderId: "568507243860",
  appId: "1:568507243860:web:f9a7128c3e703aa79c3cc1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// =============================
// DOM Elements
// =============================
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

// =============================
// App State Variables
// =============================
let stream = null;
let currentFacingMode = "user";
let currentUser = null;
const REACTION_EMOJIS = ["❤️", "🤬", "😂", "🔥", "🥲"];

// =============================
// Utils
// =============================

function getRelativeTime(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "ახლახანს";
  if (diff < 3600) return `${Math.floor(diff / 60)} წუთის წინ`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} საათის წინ`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} დღის წინ`;
  return date.toLocaleDateString();
}

// =============================
// Auth
// =============================

onAuthStateChanged(auth, user => {
  currentUser = user;
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

registerBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) return alert("გთხოვთ, შეიყვანეთ ელ. ფოსტა და პაროლი");
  createUserWithEmailAndPassword(auth, email, password)
    .catch(e => alert("რეგისტრაციის შეცდომა: " + e.message));
});

loginBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) return alert("გთხოვთ, შეიყვანეთ ელ. ფოსტა და პაროლი");
  signInWithEmailAndPassword(auth, email, password)
    .catch(e => alert("შესვლის შეცდომა: " + e.message));
});

logoutBtn.addEventListener("click", e => {
  e.preventDefault();
  signOut(auth).catch(e => alert("გასვლის შეცდომა: " + e.message));
});

// =============================
// კამერა/ფოტოს გადაღება
// =============================

async function startCamera() {
  if (stream) stream.getTracks().forEach(track => track.stop());
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentFacingMode }
    });
    video.srcObject = stream;
    video.style.filter = filterSelect.value || "none";
    video.classList.toggle("mirror", currentFacingMode === "user");
    snapBtn.disabled = true;
    video.addEventListener("loadedmetadata", () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) snapBtn.disabled = false;
    }, { once: true });
    cameraSection.classList.remove("hidden");
    authSection.classList.add("hidden");
    userActions.classList.add("hidden");
    photoFeed.classList.add("hidden");
    openCameraBtn.classList.add("hidden");
    snapBtn.classList.remove("hidden");
  } catch (e) {
    alert("კამერის ჩართვა ვერ მოხერხდა: " + e.message);
  }
}

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
  openCameraBtn.classList.remove("hidden");
  snapBtn.classList.add("hidden");
}

filterSelect.addEventListener("change", () => {
  video.style.filter = filterSelect.value || "none";
});
switchCameraBtn.addEventListener("click", () => {
  currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
  startCamera();
});

snapBtn.addEventListener("click", async () => {
  if (!stream) return alert("გთხოვთ, ჩართოთ კამერა");
  if (video.videoWidth === 0 || video.videoHeight === 0) return alert("ვიდეო ჯერ არ არის მზად, სცადე მოგვიანებით");
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
  if (!user) return alert("გთხოვთ, გაიაროთ ავტორიზაცია");
  try {
    await setDoc(doc(db, "photos", user.uid), {
      uid: user.uid,
      email: user.email,
      photo: imgData,
      text: photoText.value.trim(),
      timestamp: serverTimestamp(),
      reactions: {}
    });
    photoText.value = "";
    stopCamera();
    userActions.classList.remove("hidden");
    photoFeed.classList.remove("hidden");
    authSection.classList.add("hidden");
    photoFeed.scrollIntoView({ behavior: "smooth" });
  } catch (e) {
    alert("ატვირთვის შეცდომა: " + e.message);
  }
});

// =============================
// რეაქციების ბლოკი, ზუსტად ჩატის დიზაინით
// =============================

function renderReactions(reactions = {}, photoId) {
  const container = document.createElement("div");
  container.className = "reaction-container";
  REACTION_EMOJIS.forEach(emoji => {
    const users = reactions[emoji] || {};
    const count = Object.keys(users).length;
    const btn = document.createElement("button");
    btn.className = "reaction-btn";
    btn.type = "button";
    btn.textContent = count > 0 ? `${emoji} ${count}` : emoji;
    btn.title = emoji;
    if (currentUser && users[currentUser.uid]) btn.classList.add("active");

    btn.addEventListener("click", async () => {
      if (!currentUser) return alert("შესვლა აუცილებელია");
      const docRef = doc(db, "photos", photoId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;
      const data = snap.data();
      const updatedReactions = {...(data.reactions || {})};
      if (updatedReactions[emoji]?.[currentUser.uid]) {
        // remove
        delete updatedReactions[emoji][currentUser.uid];
        if (Object.keys(updatedReactions[emoji]).length === 0)
          delete updatedReactions[emoji];
      } else {
        if (!updatedReactions[emoji]) updatedReactions[emoji] = {};
        updatedReactions[emoji][currentUser.uid] = true;
      }
      try {
        await updateDoc(docRef, { reactions: updatedReactions });
      } catch (e) {
        alert("რეაქციის შეცდომა: " + e.message);
      }
    });

    container.appendChild(btn);
  });
  return container;
}

// =============================
// ფოტოების feed (ფოტო + რეაქცია)
// =============================

function renderPhotoFeed() {
  // სორტირება: ახალი ფოტოები პირველი
  const photosCol = collection(db, "photos");
  const q = query(photosCol, orderBy("timestamp", "desc"));
  onSnapshot(q, snapshot => {
    photoFeed.innerHTML = "";
    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      const date = d.timestamp?.toDate ? d.timestamp.toDate() : new Date();
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${d.photo}" alt="ფოტო" />
        <p>${d.text ? escapeHtml(d.text) : ""}</p>
        <small class="meta">${d.email} | ${getRelativeTime(date)}</small>
      `;
      // რეაქციების ჩასმა
      const reactionBlock = renderReactions(d.reactions, docSnap.id);
      card.appendChild(reactionBlock);
      photoFeed.appendChild(card);
    });
  });
}

// უბრალოდ პატარა helper XSS საფრთხის თავიდან ასაცილებლად
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// =============================
// UI საორგანიზაციო ივენთები
// =============================

openCameraBtn.addEventListener("click", startCamera);

burgerBtn.addEventListener("click", () => {
  navMenu.classList.toggle("active");
});

navMenu.addEventListener("click", event => {
  const target = event.target;
  if (target.tagName === "A" && target.dataset.title && target.dataset.content) {
    event.preventDefault();
    modalTitle.textContent = target.dataset.title;
    modalContent.innerHTML = target.dataset.content;
    modalOverlay.classList.add("show");
  }
});
closeModalBtn.addEventListener("click", () => modalOverlay.classList.remove("show"));
modalOverlay.addEventListener("click", event => {
  if (event.target === modalOverlay) modalOverlay.classList.remove("show");
});

// =============================
// END
// =============================
