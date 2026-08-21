import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

let stopUser = null;

function renderStatus(data) {
  const icon = document.getElementById('statusIcon');
  const title = document.getElementById('statusTitle');
  const text = document.getElementById('statusText');
  const badge = document.getElementById('statusBadge');
  const approvedActions = document.getElementById('approvedActions');
  const studentName = document.getElementById('statusName');

  studentName.textContent = data.name || 'Élève';
  const status = data.status || 'pending';
  badge.className = `approval-badge ${status}`;

  if (status === 'approved') {
    icon.textContent = '✅';
    badge.textContent = 'Inscription acceptée';
    title.textContent = 'Ton inscription est validée !';
    text.textContent = 'Tu peux maintenant accéder aux cours, aux quiz et à ton espace personnel.';
    approvedActions.classList.remove('hidden');
  } else if (status === 'rejected') {
    icon.textContent = '❌';
    badge.textContent = 'Inscription refusée';
    title.textContent = 'Ta demande n’a pas été acceptée';
    text.textContent = 'Tu peux contacter l’administration via le chat pour demander plus d’informations.';
    approvedActions.classList.add('hidden');
  } else {
    icon.textContent = '⏳';
    badge.textContent = 'En attente de validation';
    title.textContent = 'Ta demande est en cours de vérification';
    text.textContent = 'L’administrateur doit valider ton inscription avant l’accès aux cours et aux quiz.';
    approvedActions.classList.add('hidden');
  }

  const session = {
    uid: data.uid || auth.currentUser?.uid,
    name: data.name || 'Élève',
    email: data.email || auth.currentUser?.email || '',
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
  stopUser = onSnapshot(doc(db, 'users', user.uid), snap => {
    if (!snap.exists()) return;
    const data = { uid: user.uid, ...snap.data() };
    if (data.role === 'admin') {
      location.href = 'admin.html';
      return;
    }
    renderStatus(data);
  }, error => {
    console.error(error);
    document.getElementById('statusText').textContent = 'Impossible de vérifier le statut. Vérifie ta connexion puis réessaie.';
  });
});

document.getElementById('statusLogoutBtn')?.addEventListener('click', async () => {
  if (stopUser) stopUser();
  try { await signOut(auth); } catch (error) { console.warn(error); }
  localStorage.removeItem('bl_session');
  location.href = 'login.html';
});
