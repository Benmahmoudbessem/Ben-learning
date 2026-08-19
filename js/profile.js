import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

function fmtDate(v) {
  return new Date(v).toLocaleDateString('fr-FR');
}

function renderProfile(session) {
  document.getElementById('welcomeName').textContent = `Bienvenue ${session.name} 👋`;
  const sectionText = session.section ? ` · ${session.section}` : '';
  document.getElementById('profileMeta').textContent = `${session.email} · ${session.level || 'Élève'}${sectionText}`;
  document.getElementById('avatar').textContent = session.name.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

  const done = JSON.parse(localStorage.getItem(`bl_progress_${session.email}`) || '[]');
  const quiz = JSON.parse(localStorage.getItem(`bl_quiz_${session.email}`) || '[]');
  const best = quiz.length ? Math.max(...quiz.map(x => x.score)) : 0;
  const total = Math.max(6, done.length);
  const progress = Math.min(100, Math.round(done.length / total * 100));

  document.getElementById('completedCount').textContent = done.length;
  document.getElementById('quizCount').textContent = quiz.length;
  document.getElementById('bestScore').textContent = `${best}%`;
  document.getElementById('progressValue').textContent = `${progress}%`;
  document.getElementById('completedCourses').innerHTML = done.length
    ? done.map(x => `<div class="mini-item"><span>${x.title}</span><small>${fmtDate(x.date)}</small></div>`).join('')
    : '<p>Aucun cours terminé pour le moment.</p>';
  document.getElementById('quizHistory').innerHTML = quiz.length
    ? quiz.map(x => `<div class="mini-item"><span>Score ${x.score}%</span><small>${fmtDate(x.date)}</small></div>`).join('')
    : '<p>Aucun quiz effectué pour le moment.</p>';
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    localStorage.removeItem('bl_session');
    location.href = 'login.html';
    return;
  }

  let session = JSON.parse(localStorage.getItem('bl_session') || 'null');
  if (!session || session.uid !== user.uid) {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const data = snap.exists() ? snap.data() : {};
      session = {
        uid: user.uid,
        name: data.name || user.email?.split('@')[0] || 'Élève',
        email: user.email,
        level: data.level || '',
        section: data.section || '',
        role: data.role || 'student'
      };
      localStorage.setItem('bl_session', JSON.stringify(session));
    } catch (error) {
      console.error(error);
      session = { uid: user.uid, name: 'Élève', email: user.email, level: '', section: '', role: 'student' };
    }
  }

  renderProfile(session);
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  try { await signOut(auth); } catch (error) { console.warn(error); }
  localStorage.removeItem('bl_session');
  location.href = 'login.html';
});
