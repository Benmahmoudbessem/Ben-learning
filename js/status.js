import { auth, db } from './firebase.js';
import {
  onAuthStateChanged,
  signOut,
  sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import {
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

let stopUser = null;
let currentProfile = null;
let resendCooldown = 0;

function setVerificationMessage(text, ok = false) {
  const el = document.getElementById('verificationMessage');
  if (!el) return;
  el.textContent = text;
  el.style.color = ok ? '#15803d' : '#dc2626';
}

async function syncEmailVerification(user) {
  await user.reload();
  await user.getIdToken(true);

  if (user.emailVerified && currentProfile?.emailVerified !== true) {
    await updateDoc(doc(db, 'users', user.uid), {
      emailVerified: true,
      emailVerifiedAt: serverTimestamp(),
      emailVerifiedAtIso: new Date().toISOString()
    });
    currentProfile = { ...currentProfile, emailVerified: true };
  }

  return Boolean(user.emailVerified && currentProfile?.emailVerified === true);
}

function updateSteps(emailVerified, status) {
  const accountStep = document.getElementById('stepAccount');
  const emailStep = document.getElementById('stepEmail');
  const adminStep = document.getElementById('stepAdmin');
  const accessStep = document.getElementById('stepAccess');

  accountStep?.classList.add('done');
  emailStep?.classList.toggle('done', emailVerified);
  adminStep?.classList.toggle('done', emailVerified && status === 'approved');
  accessStep?.classList.toggle('done', emailVerified && status === 'approved');
}

function renderStatus(data, emailVerified) {
  const icon = document.getElementById('statusIcon');
  const title = document.getElementById('statusTitle');
  const text = document.getElementById('statusText');
  const badge = document.getElementById('statusBadge');
  const approvedActions = document.getElementById('approvedActions');
  const verifiedContactActions = document.getElementById('verifiedContactActions');
  const verificationActions = document.getElementById('verificationActions');
  const studentName = document.getElementById('statusName');
  const emailText = document.getElementById('statusEmail');

  studentName.textContent = data.name || 'Élève';
  emailText.textContent = data.email || auth.currentUser?.email || '';
  const status = data.status || 'pending';

  updateSteps(emailVerified, status);

  if (!emailVerified) {
    icon.textContent = '📧';
    badge.className = 'approval-badge email-pending';
    badge.textContent = 'Email à vérifier';
    title.textContent = 'Vérifie ton adresse email';
    text.textContent = 'Un lien de vérification a été envoyé à ton adresse. Clique sur ce lien, puis reviens ici et appuie sur « J’ai vérifié mon email ».';
    approvedActions.classList.add('hidden');
    verifiedContactActions.classList.add('hidden');
    verificationActions.classList.remove('hidden');
  } else {
    verificationActions.classList.add('hidden');
    verifiedContactActions.classList.remove('hidden');

    if (status === 'approved') {
      icon.textContent = '✅';
      badge.className = 'approval-badge approved';
      badge.textContent = 'Inscription acceptée';
      title.textContent = 'Ton inscription est validée !';
      text.textContent = 'Ton email est vérifié et l’administration a accepté ton inscription. Tu peux accéder à tout Ben-Learning.';
      approvedActions.classList.remove('hidden');
    } else if (status === 'rejected') {
      icon.textContent = '❌';
      badge.className = 'approval-badge rejected';
      badge.textContent = 'Inscription refusée';
      title.textContent = 'Ta demande n’a pas été acceptée';
      text.textContent = 'Ton email est bien vérifié. Tu peux contacter l’administration pour demander plus d’informations.';
      approvedActions.classList.add('hidden');
    } else {
      icon.textContent = '⏳';
      badge.className = 'approval-badge pending';
      badge.textContent = 'Email vérifié · validation en attente';
      title.textContent = 'Email vérifié ✅';
      text.textContent = 'Ton adresse email est valide. L’administrateur doit maintenant valider ton inscription avant l’accès aux cours et aux quiz.';
      approvedActions.classList.add('hidden');
    }
  }

  const session = {
    uid: data.uid || auth.currentUser?.uid,
    name: data.name || 'Élève',
    email: data.email || auth.currentUser?.email || '',
    emailVerified,
    level: data.level || '',
    section: data.section || '',
    role: data.role || 'student',
    status
  };
  localStorage.setItem('bl_session', JSON.stringify(session));
}

onAuthStateChanged(auth, user => {
  if (!user) {
    location.href = 'login.html';
    return;
  }

  stopUser = onSnapshot(doc(db, 'users', user.uid), async snap => {
    if (!snap.exists()) return;
    currentProfile = { uid: user.uid, ...snap.data() };

    if (currentProfile.role === 'admin') {
      location.href = 'admin.html';
      return;
    }

    try {
      const emailVerified = await syncEmailVerification(user);
      renderStatus(currentProfile, emailVerified);
    } catch (error) {
      console.error(error);
      renderStatus(currentProfile, Boolean(user.emailVerified && currentProfile.emailVerified === true));
    }
  }, error => {
    console.error(error);
    document.getElementById('statusText').textContent = 'Impossible de vérifier le statut. Vérifie ta connexion puis réessaie.';
  });
});

document.getElementById('checkVerificationBtn')?.addEventListener('click', async () => {
  const user = auth.currentUser;
  if (!user) return;
  const btn = document.getElementById('checkVerificationBtn');

  try {
    btn.disabled = true;
    btn.textContent = 'Vérification…';
    const verified = await syncEmailVerification(user);

    if (verified) {
      setVerificationMessage('Email vérifié ✅ Ta demande peut maintenant être validée par l’administration.', true);
      renderStatus(currentProfile, true);
    } else {
      setVerificationMessage('Ton email n’est pas encore vérifié. Ouvre le message Firebase reçu dans ta boîte mail et clique sur le lien.');
    }
  } catch (error) {
    console.error(error);
    setVerificationMessage('Impossible de vérifier maintenant. Réessaie dans quelques instants.');
  } finally {
    btn.disabled = false;
    btn.textContent = '✅ J’ai vérifié mon email';
  }
});

document.getElementById('resendVerificationBtn')?.addEventListener('click', async () => {
  const user = auth.currentUser;
  if (!user || resendCooldown > 0) return;
  const btn = document.getElementById('resendVerificationBtn');

  try {
    btn.disabled = true;
    await sendEmailVerification(user);
    setVerificationMessage('Un nouvel email de vérification a été envoyé ✅', true);

    resendCooldown = 60;
    const timer = setInterval(() => {
      resendCooldown -= 1;
      btn.textContent = resendCooldown > 0
        ? `Renvoyer dans ${resendCooldown}s`
        : '📨 Renvoyer l’email';
      if (resendCooldown <= 0) {
        clearInterval(timer);
        btn.disabled = false;
      }
    }, 1000);
  } catch (error) {
    console.error(error);
    btn.disabled = false;
    btn.textContent = '📨 Renvoyer l’email';
    if (error?.code === 'auth/too-many-requests') {
      setVerificationMessage('Trop de demandes. Attends quelques minutes avant de renvoyer un email.');
    } else {
      setVerificationMessage("Impossible d'envoyer l'email de vérification pour le moment.");
    }
  }
});

document.getElementById('statusLogoutBtn')?.addEventListener('click', async () => {
  if (stopUser) stopUser();
  try { await signOut(auth); } catch (error) { console.warn(error); }
  localStorage.removeItem('bl_session');
  location.href = 'login.html';
});
