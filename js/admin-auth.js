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
      showMessage("Ce compte n'a pas le rôle administrateur.");
      button.disabled = false;
      button.textContent = 'Connexion Admin';
      return;
    }

    localStorage.setItem('bl_admin_session', 'true');
    showMessage('Accès administrateur autorisé ✅', true);
    location.href = 'admin.html';
  } catch (error) {
    console.error(error);
    showMessage('Email ou mot de passe administrateur incorrect, ou accès Firebase refusé.');
    button.disabled = false;
    button.textContent = 'Connexion Admin';
  }
});
