import { auth, db } from './firebase.js';
import {
  signInWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import {
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

const form = document.getElementById('adminLoginForm');
const message = document.getElementById('adminMessage');

function showMessage(text, ok = false) {
  message.textContent = text;
  message.style.color = ok ? '#15803d' : '#dc2626';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  const email = document.getElementById('adminEmail').value.trim().toLowerCase();
  const password = document.getElementById('adminPassword').value;

  try {
    button.disabled = true;
    button.textContent = 'Vérification…';
    showMessage('Connexion à Firebase…', true);

    const credential = await signInWithEmailAndPassword(auth, email, password);
    const profileSnap = await getDoc(doc(db, 'users', credential.user.uid));
    const profile = profileSnap.exists() ? profileSnap.data() : null;

    if (!profile || profile.role !== 'admin') {
      await signOut(auth);
      showMessage(!profile
        ? "Compte connecté, mais aucun profil trouvé dans Firestore → users. Vérifie le document de cet utilisateur."
        : "Ce compte n'a pas le rôle administrateur dans Firestore → users.");
      button.disabled = false;
      button.textContent = 'Connexion Admin';
      return;
    }

    localStorage.setItem('bl_admin_session', 'true');
    showMessage('Accès administrateur autorisé ✅', true);
    location.href = 'admin.html';
  } catch (error) {
    console.error(error);
    const messages = {
      'auth/invalid-credential': 'Email ou mot de passe administrateur incorrect.',
      'auth/user-not-found': 'Aucun compte Firebase avec cet email.',
      'auth/wrong-password': 'Mot de passe administrateur incorrect.',
      'auth/invalid-email': 'Adresse email non valide.',
      'auth/network-request-failed': 'Connexion Internet indisponible. Vérifie le réseau.',
      'auth/too-many-requests': 'Trop de tentatives. Réessaie plus tard.',
      'permission-denied': 'Accès au profil refusé par les règles Firestore. Vérifie les autorisations du compte admin.',
      'firestore/permission-denied': 'Accès au profil refusé par Firestore.'
    };
    showMessage(messages[error?.code] || `Connexion administrateur impossible (${error?.code || 'erreur inconnue'}). Consulte la console F12.`);
    button.disabled = false;
    button.textContent = 'Connexion Admin';
  }
});
