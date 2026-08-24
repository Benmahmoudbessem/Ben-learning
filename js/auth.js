import { auth, db } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc
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
    'auth/network-request-failed': 'Problème de connexion Internet. Réessaie.',
    'auth/too-many-requests': 'Trop de demandes ont été envoyées. Attends quelques minutes puis réessaie.'
  };
  return messages[code] || `Erreur Firebase : ${error?.message || 'opération impossible'}`;
}

function saveSession(user, data = {}) {
  const session = {
    uid: user.uid,
    name: data.name || user.email?.split('@')[0] || 'Utilisateur',
    email: user.email,
    emailVerified: Boolean(user.emailVerified && data.emailVerified === true),
    level: data.level || '',
    section: data.section || '',
    role: data.role || 'student',
    status: data.status || 'pending'
  };
  localStorage.setItem('bl_session', JSON.stringify(session));
  return session;
}

async function syncVerifiedEmail(user, data) {
  try {
    await user.reload();
    await user.getIdToken(true);
  } catch (error) {
    console.warn('Actualisation du compte Firebase impossible.', error);
  }

  if (user.emailVerified && data?.emailVerified !== true) {
    await updateDoc(doc(db, 'users', user.uid), {
      emailVerified: true,
      emailVerifiedAt: serverTimestamp(),
      emailVerifiedAtIso: new Date().toISOString()
    });
    return { ...data, emailVerified: true };
  }
  return data || {};
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
      submitBtn.textContent = 'Création du compte…';
      msg('Création du compte Firebase…', true);

      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const user = credential.user;
      const profile = {
        uid: user.uid,
        name,
        email,
        emailVerified: false,
        level,
        section,
        role: 'student',
        status: 'pending',
        createdAt: serverTimestamp(),
        createdAtIso: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), profile);
      saveSession(user, profile);

      try {
        await sendEmailVerification(user);
        msg('Compte créé ✅ Un email de vérification vient de t’être envoyé.', true);
      } catch (verificationError) {
        console.warn(verificationError);
        msg('Compte créé, mais l’email de vérification n’a pas pu être envoyé. Tu pourras le renvoyer depuis la page suivante.', true);
      }

      setTimeout(() => location.href = 'status.html', 900);
    } catch (error) {
      console.error(error);
      msg(friendlyFirebaseError(error));
      submitBtn.disabled = false;
      submitBtn.textContent = 'Envoyer ma demande d’inscription';
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
          emailVerified: false,
          level: '',
          section: '',
          role: 'student',
          status: 'pending',
          createdAt: serverTimestamp(),
          createdAtIso: new Date().toISOString()
        });
        userDoc = await getDoc(doc(db, 'users', user.uid));
      }

      let data = userDoc.data() || {};

      if (data.role === 'admin') {
        saveSession(user, data);
        location.href = 'admin.html';
        return;
      }

      data = await syncVerifiedEmail(user, data);
      const session = saveSession(user, data);

      if (!user.emailVerified || data.emailVerified !== true) {
        location.href = 'status.html';
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

const studentLevelSelect=document.getElementById('studentLevel');
const studentSectionSelect=document.getElementById('studentSection');
function syncStudentSection(){
  if(!studentLevelSelect||!studentSectionSelect)return;
  const isFirst=studentLevelSelect.value==='1ère';
  [...studentSectionSelect.options].forEach(o=>{if(o.value&&o.value!=='Tronc commun')o.hidden=isFirst;});
  if(isFirst){studentSectionSelect.value='Tronc commun';studentSectionSelect.disabled=true;}
  else{studentSectionSelect.disabled=false;if(studentSectionSelect.value==='Tronc commun')studentSectionSelect.value='';}
}
studentLevelSelect?.addEventListener('change',syncStudentSection);
syncStudentSection();
