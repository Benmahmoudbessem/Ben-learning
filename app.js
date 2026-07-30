import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Configuration de votre projet Ben-learning
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

// Éléments DOM (Ajustés pour correspondre à index.html)
const authContainer = document.getElementById("auth-container");
const appContainer = document.getElementById("app-container"); // Corrigé (au lieu de dashboard-container)
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btnLogin = document.getElementById("btn-login");
const btnSignup = document.getElementById("btn-signup");
const btnLogout = document.getElementById("btn-logout");
const userEmailSpan = document.getElementById("user-email-display"); // Corrigé (au lieu de user-email)
const errorMsg = document.getElementById("error-message");

// Fonctions d'erreur
function showError(msg) { 
  errorMsg.textContent = msg; 
  errorMsg.style.display = "block"; 
}

function clearError() { 
  errorMsg.textContent = ""; 
  errorMsg.style.display = "none"; 
}

// 1. Inscription avec gestion d'erreurs détaillée
btnSignup.addEventListener("click", () => {
  clearError();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  if (!email || !password) {
    showError("Veuillez remplir tous les champs.");
    return;
  }

  if (password.length < 6) {
    showError("Le mot de passe doit faire au moins 6 caractères.");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log("Compte créé avec succès !", userCredential.user);
    })
    .catch((error) => {
      console.error("Code d'erreur Firebase :", error.code);
      console.error("Message d'erreur :", error.message);

      if (error.code === "auth/operation-not-allowed") {
        showError("ERREUR : Vous devez activer l'authentification par E-mail/Mot de passe dans la console Firebase !");
      } else if (error.code === "auth/email-already-in-use") {
        showError("Cet e-mail est déjà utilisé par un autre compte.");
      } else if (error.code === "auth/invalid-email") {
        showError("L'adresse e-mail n'est pas valide.");
      } else if (error.code === "auth/unauthorized-domain") {
        showError("Ce domaine n'est pas autorisé dans la console Firebase.");
      } else {
        showError("Erreur Firebase : " + error.message);
      }
    });
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

// 4. Écouteur de connexion / déconnexion
onAuthStateChanged(auth, (user) => {
  clearError();
  if (user) {
    authContainer.style.display = "none";
    appContainer.style.display = "block";
    userEmailSpan.textContent = user.email;
  } else {
    authContainer.style.display = "block";
    appContainer.style.display = "none";
  }
});

// 5. Filtre par niveau
const filterButtons = document.querySelectorAll('.filter-btn'); // Corrigé (.filter-btn au lieu de .level-btn)
const courseCards = document.querySelectorAll('.course-card');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    const selectedLevel = button.getAttribute('data-filter'); // Corrigé (data-filter)
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