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
    const email = emailInput?.value.trim();
    const password = passwordInput?.value;
    if (!email || !password) return showError("Veuillez remplir tous les champs.");

    createUserWithEmailAndPassword(auth, email, password)
      .catch((error) => showError("Erreur : " + error.message));
  });
}

if (btnLogin) {
  btnLogin.addEventListener("click", () => {
    clearError();
    const email = emailInput?.value.trim();
    const password = passwordInput?.value;
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

    // Mise à jour des informations du Profil
    const profileEmailText = document.getElementById("profile-email-text");
    const infoEmail = document.getElementById("info-email");
    const profileDisplayName = document.getElementById("profile-display-name");
    const avatarImg = document.getElementById("profile-avatar-img");

    if (profileEmailText) profileEmailText.textContent = user.email;
    if (infoEmail) infoEmail.textContent = user.email;

    // Extraction du nom (ex: ali.ben -> ALI BEN)
    const rawName = user.email.split('@')[0].replace(/[\._-]/g, ' ');
    const formattedName = rawName.toUpperCase();
    if (profileDisplayName) profileDisplayName.textContent = formattedName;

    // Avatar dynamique
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
const btnLogoutProfile = document.getElementById("btn-logout-profile");
if (btnLogoutProfile) {
  btnLogoutProfile.addEventListener("click", () => signOut(auth));
}

// DEMANDE DE RÉINITIALISATION (FORMSPREE)
const btnResetPassword = document.getElementById("btn-reset-password");
if (btnResetPassword) {
  btnResetPassword.addEventListener("click", () => {
    const user = auth.currentUser;
    if (user && user.email) {
      const formspreeUrl = "https://formspree.io/f/xeeyylpb"; 

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

// --- NAVIGATION INTERNE ENTRE PAGES ---
const navLinks = document.querySelectorAll(".sidebar-nav .nav-link");
const pageSections = document.querySelectorAll(".page-section");

function navigateToPage(pageId) {
  pageSections.forEach(section => {
    section.classList.remove("active");
    if (section.id === pageId) {
      section.classList.add("active");
    }
  });

  navLinks.forEach(link => {
    if (link.getAttribute("data-page") === pageId) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

navLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const pageId = link.getAttribute("data-page");
    navigateToPage(pageId);
  });
});

document.querySelectorAll(".nav-shortcut").forEach(btn => {
  btn.addEventListener("click", () => {
    const targetPage = btn.getAttribute("data-target");
    navigateToPage(targetPage);
  });
});

// --- FILTRAGE DYNAMIQUE (NIVEAU -> SECTION) ---
const levelFilterBtns = document.querySelectorAll("#level-filters .filter-btn");
const sectionFiltersWrapper = document.getElementById("section-filters-wrapper");
const sectionFiltersContainer = document.getElementById("section-filters");
const resourceCards = document.querySelectorAll("#homework-grid .resource-card");

// Mappage complet de TOUTES les sections disponibles selon le niveau sélectionné
const sectionsByLevel = {
  "bac": [
    { id: "all", label: "Toutes les sections" },
    { id: "info", label: "Sciences Info" },
    { id: "sciences", label: "Sciences Exp / Math" },
    { id: "eco", label: "Éco & Services" },
    { id: "lettres", label: "Lettres" },
    { id: "technique", label: "Technique" }
  ],
  "3em": [
    { id: "all", label: "Toutes les sections" },
    { id: "info", label: "Sciences Info" },
    { id: "sciences", label: "Sciences Exp / Math" },
    { id: "eco", label: "Éco & Services" },
    { id: "lettres", label: "Lettres" },
    { id: "technique", label: "Technique" }
  ],
  "2em": [
    { id: "all", label: "Toutes les sections" },
    { id: "info", label: "Sciences Info" },
    { id: "sciences", label: "Sciences" },
    { id: "eco", label: "Éco & Services" },
    { id: "lettres", label: "Lettres" },
    { id: "technique", label: "Technique" }
  ],
  "1ere": [
    { id: "all", label: "Toutes les options" },
    { id: "info", label: "Initiation Informatique" }
  ],
  "univ": [
    { id: "all", label: "Tous les parcours" },
    { id: "info", label: "Génie Logiciel / Informatique" }
  ]
};

let currentLevel = "all";
let currentSection = "all";

function applyCardFilters() {
  resourceCards.forEach(card => {
    const cardYear = card.getAttribute("data-year");
    const cardSection = card.getAttribute("data-section");

    const matchesLevel = (currentLevel === "all" || cardYear === currentLevel);
    const matchesSection = (currentSection === "all" || cardSection === currentSection);

    if (matchesLevel && matchesSection) {
      card.style.display = "flex";
    } else {
      card.style.display = "none";
    }
  });
}

function renderSectionFilters(level) {
  if (level === "all" || !sectionsByLevel[level]) {
    sectionFiltersWrapper.style.display = "none";
    currentSection = "all";
    return;
  }

  sectionFiltersContainer.innerHTML = "";
  const sections = sectionsByLevel[level];

  sections.forEach((sec, index) => {
    const btn = document.createElement("button");
    btn.className = `filter-btn ${index === 0 ? "active" : ""}`;
    btn.setAttribute("data-section-filter", sec.id);
    btn.textContent = sec.label;

    btn.addEventListener("click", () => {
      document.querySelectorAll("#section-filters .filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentSection = sec.id;
      applyCardFilters();
    });

    sectionFiltersContainer.appendChild(btn);
  });

  sectionFiltersWrapper.style.display = "block";
  currentSection = "all";
}

levelFilterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    levelFilterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    currentLevel = btn.getAttribute("data-filter");
    renderSectionFilters(currentLevel);
    applyCardFilters();
  });
});

// --- RECHERCHE GLOBALE EN TEMPS RÉEL ---
const globalSearchInput = document.getElementById("global-search");
if (globalSearchInput) {
  globalSearchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    const searchableItems = document.querySelectorAll(".searchable-item");

    searchableItems.forEach(item => {
      const textContent = item.textContent.toLowerCase();
      if (textContent.includes(searchTerm)) {
        item.style.display = "";
      } else {
        item.style.display = "none";
      }
    });
  });
}

// --- RECALCUL DES COMPTEURS ---
function recalculateStats() {
  const coursesCount = document.querySelectorAll('.resource-card[data-type="course"]').length;
  const homeworkCount = document.querySelectorAll('.resource-card[data-type="homework"]').length;
  const videoCount = document.querySelectorAll('.resource-card[data-type="video"]').length;

  const statCourses = document.getElementById("stat-count-courses");
  const statHomework = document.getElementById("stat-count-homework");
  const statVideos = document.getElementById("stat-count-videos");

  if (statCourses) statCourses.textContent = coursesCount;
  if (statHomework) statHomework.textContent = homeworkCount;
  if (statVideos) statVideos.textContent = videoCount;
}

// --- GESTION DU MENU MOBILE ---
document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.querySelector('.sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const mobileNavLinks = document.querySelectorAll('.sidebar-nav .nav-link');

  function openSidebar() {
    sidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sidebar.classList.contains('active')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }

  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        closeSidebar();
      }
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && sidebar.classList.contains('active')) {
      closeSidebar();
    }
  });
});