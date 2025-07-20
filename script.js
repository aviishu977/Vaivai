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
  orderBy,
  addDoc,
  where,
  getDocs,
  deleteDoc
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
// State Variables
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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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

filterSelect && filterSelect.addEventListener("change", () => {
  video.style.filter = filterSelect.value || "none";
});
switchCameraBtn && switchCameraBtn.addEventListener("click", () => {
  currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
  startCamera();
});

// =============================
// პოსტირების მთავარი ბლოკი (ძველი პოსტის წაშლა)
// =============================

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
    // ძველი პოსტების წაშლა
    const q = query(collection(db, "photos"), where("uid", "==", user.uid));
    const prev = await getDocs(q);
    for (const docSnap of prev.docs) {
      await deleteDoc(doc(db, "photos", docSnap.id));
    }
    // ახალი პოსტის დამატება
    await addDoc(collection(db, "photos"), {
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
// რეაქციების ბლოკი
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
// ფოტოს card generator
// =============================

function createPhotoCard(data, photoId) {
  const date = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
  const card = document.createElement("div");
  card.className = "card";
  card.setAttribute('data-photo-id', photoId);
  card.innerHTML = `
    <img src="${data.photo}" alt="ფოტო" />
    <p>${data.text ? escapeHtml(data.text) : ""}</p>
    <small class="meta">${data.email} | ${getRelativeTime(date)}</small>
  `;
  const reactionBlock = renderReactions(data.reactions, photoId);
  reactionBlock.classList.add('reactions-block');
  card.appendChild(reactionBlock);
  return card;
}

function updateReactionBlock(photoId, newReactions) {
  const card = photoFeed.querySelector(`[data-photo-id="${photoId}"]`);
  if (!card) return;
  const oldBlock = card.querySelector('.reactions-block');
  const newBlock = renderReactions(newReactions, photoId);
  newBlock.classList.add('reactions-block');
  if (oldBlock) card.replaceChild(newBlock, oldBlock);
  else card.appendChild(newBlock);
}

// =============================
// Feed Rendering (ოპტიმიზირებული!)
// =============================

function renderPhotoFeed() {
  const photosCol = collection(db, "photos");
  const q = query(photosCol, orderBy("timestamp", "desc"));
  const cardMap = {};
  onSnapshot(q, snapshot => {
    snapshot.docChanges().forEach(change => {
      const d = change.doc.data();
      const photoId = change.doc.id;
      if (change.type === "added") {
        const card = createPhotoCard(d, photoId);
        cardMap[photoId] = card;
        if (photoFeed.firstChild)
          photoFeed.insertBefore(card, photoFeed.firstChild);
        else
          photoFeed.appendChild(card);
      } else if (change.type === "modified") {
        updateReactionBlock(photoId, d.reactions);
      } else if (change.type === "removed") {
        if (cardMap[photoId]) {
          cardMap[photoId].remove();
          delete cardMap[photoId];
        }
      }
    });
  });
}

// =============================
// UI საორგანიზაციო ივენთები
// =============================

openCameraBtn && openCameraBtn.addEventListener("click", startCamera);

burgerBtn && burgerBtn.addEventListener("click", () => {
  navMenu.classList.toggle("active");
});

navMenu && navMenu.addEventListener("click", event => {
  const target = event.target;
  if (target.tagName === "A" && target.dataset.title && target.dataset.content) {
    event.preventDefault();
    modalTitle.textContent = target.dataset.title;
    modalContent.innerHTML = target.dataset.content;
    modalOverlay.classList.add("show");
  }
});
closeModalBtn && closeModalBtn.addEventListener("click", () => modalOverlay.classList.remove("show"));
modalOverlay && modalOverlay.addEventListener("click", event => {
  if (event.target === modalOverlay) modalOverlay.classList.remove("show");
});

// =============================
// END
// =============================
