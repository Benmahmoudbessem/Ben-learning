import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail 
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

// DOM Elements
const authContainer = document.getElementById("auth-container");
const appContainer = document.getElementById("app-container");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btnLogin = document.getElementById("btn-login");
const btnSignup = document.getElementById("btn-signup");
const btnLogout = document.getElementById("btn-logout");
const userEmailSpan = document.getElementById("user-email-display");
const errorMsg = document.getElementById("error-message");

function showError(msg) {
  if (errorMsg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = "block";
  }
}

function clearError() {
  if (errorMsg) {
    errorMsg.textContent = "";
    errorMsg.style.display = "none";
  }
}

// --- AUTHENTIFICATION ---
if (btnSignup) {
  btnSignup.addEventListener("click", () => {
    clearError();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) return showError("Veuillez remplir tous les champs.");

    createUserWithEmailAndPassword(auth, email, password)
      .catch((error) => showError("Erreur : " + error.message));
  });
}

if (btnLogin) {
  btnLogin.addEventListener("click", () => {
    clearError();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) return showError("Veuillez saisir vos identifiants.");

    signInWithEmailAndPassword(auth, email, password)
      .catch(() => showError("Identifiants incorrects."));
  });
}

if (btnLogout) {
  btnLogout.addEventListener("click", () => signOut(auth));
}

// --- ÉTAT DU COMPTE (OBSERVER) ---
onAuthStateChanged(auth, (user) => {
  clearError();
  if (user) {
    if (authContainer) authContainer.style.display = "none";
    if (appContainer) appContainer.style.display = "flex";
    if (userEmailSpan) userEmailSpan.textContent = user.email;

    // Mise à jour des informations de la page Profil
    const profileEmailText = document.getElementById("profile-email-text");
    const infoEmail = document.getElementById("info-email");
    const profileDisplayName = document.getElementById("profile-display-name");
    const avatarImg = document.getElementById("profile-avatar-img");

    if (profileEmailText) profileEmailText.textContent = user.email;
    if (infoEmail) infoEmail.textContent = user.email;

    // Extraction du nom à partir de l'adresse e-mail (ex: ali.ben -> ALI BEN)
    const rawName = user.email.split('@')[0].replace(/[\._-]/g, ' ');
    const formattedName = rawName.toUpperCase();
    if (profileDisplayName) profileDisplayName.textContent = formattedName;

    // Avatar dynamique avec UI-Avatars
    if (avatarImg) {
      avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedName)}&background=4f46e5&color=fff&size=128`;
    }

    recalculateStats();
  } else {
    if (authContainer) authContainer.style.display = "flex";
    if (appContainer) appContainer.style.display = "none";
  }
});

// --- ACTIONS DU PROFIL ---
// Déconnexion depuis le profil
const btnLogoutProfile = document.getElementById("btn-logout-profile");
if (btnLogoutProfile) {
  btnLogoutProfile.addEventListener("click", () => signOut(auth));
}

// DEMANDE DE RÉINITIALISATION (ENVOI À L'ENSEIGNANT)
const btnResetPassword = document.getElementById("btn-reset-password");
if (btnResetPassword) {
  btnResetPassword.addEventListener("click", () => {
    const user = auth.currentUser;
    if (user && user.email) {

      // REMPLACE L'URL CI-DESSOUS PAR TON VRAI LIEN FORMSPREE
      const formspreeUrl = "https://formspree.io/f/xeeyylpb"; 

      // Désactiver le bouton pendant l'envoi pour éviter le double-clic
      btnResetPassword.disabled = true;
      btnResetPassword.innerText = "Envoi en cours...";

      fetch(formspreeUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          eleve: user.email,
          sujet: "Demande de réinitialisation de mot de passe",
          message: `L'élève ${user.email} demande la réinitialisation de son mot de passe.`,
          date: new Date().toLocaleString("fr-FR")
        })
      })
      .then(response => {
        if (response.ok) {
          alert("Votre demande a bien été transmise à votre enseignant !");
        } else {
          alert("Une erreur s'est produite lors de l'envoi de la demande.");
        }
      })
      .catch(() => alert("Erreur de connexion lors de l'envoi."))
      .finally(() => {
        btnResetPassword.disabled = false;
        btnResetPassword.innerText = "Réinitialiser le mot de passe";
      });
    }
  });
}

// --- RECALCUL DES COMPTEURS ---
function recalculateStats() {
  const courses = document.querySelectorAll('.resource-card[data-type="course"]').length;
  const homeworks = document.querySelectorAll('.resource-card[data-type="homework"]').length;
  const videos = document.querySelectorAll('.resource-card[data-type="video"]').length;

  const statCourses = document.getElementById("stat-count-courses");
  const statHomework = document.getElementById("stat-count-homework");
  const statVideos = document.getElementById("stat-count-videos");

  if (statCourses) statCourses.textContent = courses;
  if (statHomework) statHomework.textContent = homeworks;
  if (statVideos) statVideos.textContent = videos;
}

// --- NAVIGATION ENTRE PAGES (SPA) ---
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

// --- BARRE DE RECHERCHE GLOBALE ---
const globalSearch = document.getElementById('global-search');
if (globalSearch) {
  globalSearch.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    const items = document.querySelectorAll('.searchable-item, .resource-card, .feature-box');

    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      if (term === '' || text.includes(term)) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  });
}

// --- FILTRES PAR NIVEAU ---
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