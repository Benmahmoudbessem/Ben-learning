import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ⚠️ REMPLACEZ AVEC VOS PROPRES CLÉS FIREBASE (Étape 1)
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Éléments DOM
const authContainer = document.getElementById("auth-container");
const dashboardContainer = document.getElementById("dashboard-container");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btnLogin = document.getElementById("btn-login");
const btnSignup = document.getElementById("btn-signup");
const btnLogout = document.getElementById("btn-logout");
const userEmailSpan = document.getElementById("user-email");
const errorMsg = document.getElementById("error-message");

function showError(msg) { errorMsg.textContent = msg; errorMsg.classList.remove("hidden"); }
function clearError() { errorMsg.textContent = ""; errorMsg.classList.add("hidden"); }

// 1. Inscription
btnSignup.addEventListener("click", () => {
  clearError();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) return showError("Remplissez tous les champs.");

  createUserWithEmailAndPassword(auth, email, password)
    .catch(err => showError("Erreur d'inscription (Mot de passe d'au moins 6 caractères)."));
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

// 4. Écouteur de connexion
onAuthStateChanged(auth, (user) => {
  clearError();
  if (user) {
    authContainer.classList.add("hidden");
    dashboardContainer.classList.remove("hidden");
    userEmailSpan.textContent = user.email;
  } else {
    authContainer.classList.remove("hidden");
    dashboardContainer.classList.add("hidden");
  }
});

// 5. Filtre par niveau
const filterButtons = document.querySelectorAll('.level-btn');
const courseCards = document.querySelectorAll('.course-card');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    const selectedLevel = button.getAttribute('data-level');
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