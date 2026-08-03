import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Configuration Firebase
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

// Éléments DOM
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

// 1. Inscription
btnSignup.addEventListener("click", () => {
  clearError();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) return showError("Veuillez remplir tous les champs.");
  if (password.length < 6) return showError("Le mot de passe doit faire au moins 6 caractères.");

  createUserWithEmailAndPassword(auth, email, password)
    .catch((error) => showError("Erreur : " + error.message));
});

// 2. Connexion
btnLogin.addEventListener("click", () => {
  clearError();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) return showError("Remplissez tous les champs.");

  signInWithEmailAndPassword(auth, email, password)
    .catch(() => showError("E-mail ou mot de passe incorrect."));
});

// 3. Déconnexion
btnLogout.addEventListener("click", () => signOut(auth));

// 4. Écouteur d'état d'authentification
onAuthStateChanged(auth, (user) => {
  clearError();
  if (user) {
    authContainer.style.display = "none";
    appContainer.style.display = "flex";
    userEmailSpan.textContent = user.email;
    if (profileEmailDisplay) profileEmailDisplay.textContent = user.email;
  } else {
    authContainer.style.display = "flex";
    appContainer.style.display = "none";
  }
});

// 5. Navigation entre les pages (SPA)
const navLinks = document.querySelectorAll('.nav-link');
const pageSections = document.querySelectorAll('.page-section');

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetPageId = link.getAttribute('data-page');

    navLinks.forEach(l => l.classList.remove('active'));
    pageSections.forEach(section => section.classList.remove('active'));

    link.classList.add('active');
    document.getElementById(targetPageId).classList.add('active');
  });
});

// 6. Filtre par niveau
const filterButtons = document.querySelectorAll('.filter-btn');
const courseCards = document.querySelectorAll('.course-card');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    const selectedLevel = button.getAttribute('data-filter');
    courseCards.forEach(card => {
      const cardLevel = card.getAttribute('data-level');
      if (selectedLevel === 'all' || cardLevel === selectedLevel) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  });
});

// 7. Recherche en direct dans les cours
const globalSearch = document.getElementById('global-search');
if (globalSearch) {
  globalSearch.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    courseCards.forEach(card => {
      const title = card.querySelector('h3').textContent.toLowerCase();
      const desc = card.querySelector('p').textContent.toLowerCase();
      if (title.includes(searchTerm) || desc.includes(searchTerm)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  });
}