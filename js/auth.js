import { auth, db } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

function msg(text, ok = false) {
  const el = document.getElementById('authMessage');
  if (!el) return;
  el.textContent = text;
  el.style.color = ok ? '#15803d' : '#dc2626';
}

function friendlyFirebaseError(error) {
  const code = error?.code || '';
  const messages = {
    'auth/email-already-in-use': 'Un compte existe déjà avec cet email.',
    'auth/invalid-email': "L'adresse email n'est pas valide.",
    'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
    'auth/invalid-credential': 'Email ou mot de passe incorrect.',
    'auth/user-not-found': 'Email ou mot de passe incorrect.',
    'auth/wrong-password': 'Email ou mot de passe incorrect.',
    'auth/network-request-failed': 'Problème de connexion Internet. Réessaie.'
  };
  return messages[code] || `Erreur Firebase : ${error?.message || 'opération impossible'}`;
}

function saveSession(user, data = {}) {
  const session = {
    uid: user.uid,
    name: data.name || user.email?.split('@')[0] || 'Utilisateur',
    email: user.email,
    level: data.level || '',
    section: data.section || '',
    role: data.role || 'student',
    status: data.status || 'pending'
  };
  localStorage.setItem('bl_session', JSON.stringify(session));
  return session;
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const level = document.getElementById('studentLevel').value;
    const section = document.getElementById('studentSection').value;
    const password = document.getElementById('password').value;

    if (!name || !email || !level || !section || !password) {
      msg('Merci de remplir tous les champs.');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Envoi de la demande…';
      msg('Création du compte et envoi à l’administration…', true);

      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const user = credential.user;
      const profile = {
        uid: user.uid,
        name,
        email,
        level,
        section,
        role: 'student',
        status: 'pending',
        createdAt: serverTimestamp(),
        createdAtIso: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), profile);
      saveSession(user, profile);

      msg('Demande envoyée ✅ En attente de validation par l’administrateur.', true);
      setTimeout(() => location.href = 'status.html', 650);
    } catch (error) {
      console.error(error);
      msg(friendlyFirebaseError(error));
      submitBtn.disabled = false;
      submitBtn.textContent = 'Créer mon compte';
    }
  });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Connexion…';
      msg('Connexion à Firebase…', true);

      const credential = await signInWithEmailAndPassword(auth, email, password);
      const user = credential.user;
      let userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: user.email?.split('@')[0] || 'Élève',
          email: user.email,
          level: '',
          section: '',
          role: 'student',
          status: 'pending',
          createdAt: serverTimestamp(),
          createdAtIso: new Date().toISOString()
        });
        userDoc = await getDoc(doc(db, 'users', user.uid));
      }

      const data = userDoc.data() || {};
      const session = saveSession(user, data);

      if (session.role === 'admin') {
        location.href = 'admin.html';
        return;
      }

      if (session.status !== 'approved') {
        location.href = 'status.html';
        return;
      }

      const params = new URLSearchParams(location.search);
      const requested = params.get('redirect');
      const safeRedirect = requested && !requested.includes('://') && !requested.startsWith('//')
        ? requested
        : null;
      location.href = safeRedirect || 'profile.html';
    } catch (error) {
      console.error(error);
      msg(friendlyFirebaseError(error));
      submitBtn.disabled = false;
      submitBtn.textContent = 'Se connecter';
    }
  });
}
