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

// 1. Authentification
btnSignup.addEventListener("click", () => {
  clearError();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) return showError("Veuillez remplir tous les champs.");
  if (password.length < 6) return showError("Le mot de passe doit faire au moins 6 caractères.");

  createUserWithEmailAndPassword(auth, email, password)
    .catch((error) => showError("Erreur : " + error.message));
});

btnLogin.addEventListener("click", () => {
  clearError();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) return showError("Remplissez tous les champs.");

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

    // Calculer automatiquement les vraies données
    updateDashboardStats();
  } else {
    authContainer.style.display = "flex";
    appContainer.style.display = "none";
  }
});

// 2. Calculateur automatique de ressources (Résout le problème des faux chiffres)
function updateDashboardStats() {
  const coursesCount = document.querySelectorAll('.course-card[data-type="course"]').length;
  const homeworkCount = document.querySelectorAll('.course-card[data-type="homework"]').length;
  const videosCount = document.querySelectorAll('.course-card[data-type="video"]').length;

  document.getElementById("stat-count-courses").textContent = coursesCount;
  document.getElementById("stat-count-homework").textContent = homeworkCount;
  document.getElementById("stat-count-videos").textContent = videosCount;

  // Dupliquer un aperçu dynamique sur le tableau de bord
  const previewGrid = document.getElementById("dashboard-preview-grid");
  if (previewGrid) {
    previewGrid.innerHTML = "";
    const firstCourse = document.querySelector('.course-card');
    if (firstCourse) {
      previewGrid.appendChild(firstCourse.cloneNode(true));
    }
  }
}

// 3. Navigation SPA (Onglets)
const navLinks = document.querySelectorAll('.nav-link');
const pageSections = document.querySelectorAll('.page-section');

function navigateToPage(targetPageId) {
  navLinks.forEach(l => l.classList.remove('active'));
  pageSections.forEach(section => section.classList.remove('active'));

  const activeLink = document.querySelector(`.nav-link[data-page="${targetPageId}"]`);
  if (activeLink) activeLink.classList.add('active');
  
  const targetPage = document.getElementById(targetPageId);
  if (targetPage) targetPage.classList.add('active');
}

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    navigateToPage(link.getAttribute('data-page'));
  });
});

// Bouton raccourci de la page d'accueil
const heroShortcut = document.querySelector('.nav-shortcut');
if (heroShortcut) {
  heroShortcut.addEventListener('click', () => {
    navigateToPage(heroShortcut.getAttribute('data-target'));
  });
}

// 4. Filtre par niveau
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

// 5. Recherche globale
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