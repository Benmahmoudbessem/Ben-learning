import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAe-6kFMRFzeHzIu5Q-CBbt77M5qZ5gnPU",
  authDomain: "ben-learning-91abe.firebaseapp.com",
  projectId: "ben-learning-91abe",
  storageBucket: "ben-learning-91abe.firebasestorage.app",
  messagingSenderId: "71123609216",
  appId: "1:71123609216:web:adcf00ca684f6da3c8e865",
  measurementId: "G-K78LL81RV2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM
const authContainer = document.getElementById("auth-container");
const appContainer = document.getElementById("app-container");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btnLogin = document.getElementById("btn-login");
const btnSignup = document.getElementById("btn-signup");
const btnLogout = document.getElementById("btn-logout");
const userEmailSpan = document.getElementById("user-email-display");
const profileEmailDisplay = document.getElementById("profile-email-display");
const errorMsg = document.getElementById("error-message");

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = "block";
}

function clearError() {
  errorMsg.textContent = "";
  errorMsg.style.display = "none";
}

// Authentification
btnSignup.addEventListener("click", () => {
  clearError();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) return showError("Veuillez remplir tous les champs.");

  createUserWithEmailAndPassword(auth, email, password)
    .catch((error) => showError("Erreur : " + error.message));
});

btnLogin.addEventListener("click", () => {
  clearError();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) return showError("Veuillez saisir vos identifiants.");

  signInWithEmailAndPassword(auth, email, password)
    .catch(() => showError("Identifiants incorrects."));
});

btnLogout.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  clearError();
  if (user) {
    authContainer.style.display = "none";
    appContainer.style.display = "flex";
    userEmailSpan.textContent = user.email;
    if (profileEmailDisplay) profileEmailDisplay.textContent = user.email;

    // Mise à jour exacte des compteurs
    recalculateStats();
  } else {
    authContainer.style.display = "flex";
    appContainer.style.display = "none";
  }
});

// FONCTION DE CALCUL DYNAMIQUE EXACT
function recalculateStats() {
  const courses = document.querySelectorAll('.resource-card[data-type="course"]').length;
  const homeworks = document.querySelectorAll('.resource-card[data-type="homework"]').length;
  const videos = document.querySelectorAll('.resource-card[data-type="video"]').length;

  document.getElementById("stat-count-courses").textContent = courses;
  document.getElementById("stat-count-homework").textContent = homeworks;
  document.getElementById("stat-count-videos").textContent = videos;
}

// Navigation SPA
const navLinks = document.querySelectorAll('.nav-link');
const pageSections = document.querySelectorAll('.page-section');

function switchTab(pageId) {
  navLinks.forEach(l => l.classList.remove('active'));
  pageSections.forEach(s => s.classList.remove('active'));

  const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
  if (activeLink) activeLink.classList.add('active');

  const activePage = document.getElementById(pageId);
  if (activePage) activePage.classList.add('active');
}

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab(link.getAttribute('data-page'));
  });
});

document.querySelectorAll('.nav-shortcut').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.getAttribute('data-target')));
});

// Filtres par niveau
const filterButtons = document.querySelectorAll('.filter-btn');
const resourceCards = document.querySelectorAll('.resource-card');

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.getAttribute('data-filter');
    resourceCards.forEach(card => {
      const level = card.getAttribute('data-level');
      if (filter === 'all' || level === filter) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  });
});

// Recherche globale
const globalSearch = document.getElementById('global-search');
if (globalSearch) {
  globalSearch.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    resourceCards.forEach(card => {
      const title = card.querySelector('h3').textContent.toLowerCase();
      const text = card.querySelector('p').textContent.toLowerCase();
      if (title.includes(term) || text.includes(term)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  });
}