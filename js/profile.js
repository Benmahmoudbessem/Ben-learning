import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

let stopNotifications = null;

function escapeHtml(v='') {
  return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function toDate(v) {
  if (!v) return new Date(0);
  if (typeof v.toDate === 'function') return v.toDate();
  if (v.seconds) return new Date(v.seconds * 1000);
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}
function fmtDate(v) {
  const d = toDate(v);
  return d.getTime() ? d.toLocaleDateString('fr-FR', {day:'2-digit', month:'short', year:'numeric'}) : '—';
}
function fmtDateTime(v) {
  const d = toDate(v);
  return d.getTime() ? d.toLocaleString('fr-FR', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'}) : '—';
}
function normalizeCourse(c) {
  if (c.section) return c;
  const old = String(c.level || '');
  if (old.startsWith('Bac ')) return {...c, level:'Bac', section:old.replace('Bac ', '')};
  if (old.startsWith('3ème ')) return {...c, level:'3ème', section:old.replace('3ème ', '')};
  if (old.startsWith('2ème ')) return {...c, level:'2ème', section:old.replace('2ème ', '')};
  return {...c, section:old === '1ère' ? 'Tronc commun' : 'Informatique'};
}
function getAdminCourses() {
  return JSON.parse(localStorage.getItem('bl_admin_courses') || '[]').map(normalizeCourse);
}
function matchesStudent(course, session) {
  if (!course || course.level !== session.level) return false;
  if (session.level === '1ère') return true;
  if (!session.section) return true;
  return !course.section || course.section === session.section || course.section === 'Tronc commun' || course.section === 'Toutes';
}
function localProgress(session) {
  return JSON.parse(localStorage.getItem(`bl_progress_${session.email}`) || '[]');
}
function localQuiz(session) {
  return JSON.parse(localStorage.getItem(`bl_quiz_${session.email}`) || '[]');
}
function uniqueBy(items, keyFn) {
  const map = new Map();
  items.forEach(item => {
    const key = keyFn(item);
    if (!map.has(key) || toDate(item.date || item.completedAt || item.createdAt) > toDate(map.get(key).date || map.get(key).completedAt || map.get(key).createdAt)) map.set(key, item);
  });
  return [...map.values()];
}
function calculateStreak(events) {
  const days = new Set(events.map(e => {
    const d = toDate(e.date || e.completedAt || e.createdAt);
    return d.getTime() ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : null;
  }).filter(Boolean));
  if (!days.size) return 0;
  const today = new Date();
  today.setHours(0,0,0,0);
  let cursor = new Date(today);
  const todayKey = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
  if (!days.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (true) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (!days.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

async function loadRemoteProgress(uid) {
  try {
    const snap = await getDocs(query(collection(db, 'courseProgress'), where('userId', '==', uid)));
    return snap.docs.map(d => ({id:d.id, ...d.data()}));
  } catch (error) {
    console.warn('Progression Firestore indisponible, utilisation locale.', error);
    return [];
  }
}
async function loadRemoteQuiz(uid) {
  try {
    const snap = await getDocs(query(collection(db, 'quizResults'), where('userId', '==', uid)));
    return snap.docs.map(d => ({id:d.id, ...d.data()}));
  } catch (error) {
    console.warn('Historique quiz Firestore indisponible, utilisation locale.', error);
    return [];
  }
}
async function loadAllCourses() {
  let seed = [];
  try { const response = await fetch('data/courses.json'); seed = response.ok ? await response.json() : []; } catch {}
  let cloud = [];
  try {
    const snap = await getDocs(collection(db, 'courses'));
    cloud = snap.docs.map(d => ({id:d.id, ...d.data()}));
  } catch (error) { console.warn('Catalogue Firestore indisponible', error); }
  const map = new Map();
  [...seed.map(normalizeCourse), ...getAdminCourses(), ...cloud.map(normalizeCourse)].forEach(c => map.set(String(c.id), c));
  return [...map.values()];
}

async function renderAcademicExtras(session) {
  const sessionShell = document.getElementById('nextSessionCard');
  const homeworkShell = document.getElementById('nextHomeworkCard');
  if (!sessionShell || !homeworkShell) return;
  try {
    const [ss, hs, subs] = await Promise.all([
      getDocs(collection(db, 'sessions')),
      getDocs(collection(db, 'homework')),
      getDocs(query(collection(db, 'homeworkSubmissions'), where('userId', '==', session.uid)))
    ]);
    const relevant = x => {
      if (x.level && x.level !== 'Tous' && x.level !== session.level) return false;
      if (session.level === '1ère') return true;
      return !x.section || x.section === 'Toutes' || x.section === 'Tronc commun' || x.section === session.section;
    };
    const now = new Date();
    const nextSession = ss.docs.map(d => ({id:d.id, ...d.data()})).filter(relevant).filter(x => new Date(x.startAtIso) >= now).sort((a,b)=>new Date(a.startAtIso)-new Date(b.startAtIso))[0];
    if (nextSession) {
      const d = new Date(nextSession.startAtIso);
      sessionShell.innerHTML = `<div class="glance-icon">📅</div><div><strong>${escapeHtml(nextSession.title || 'Séance')}</strong><p>${d.toLocaleString('fr-FR',{weekday:'long',day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit'})}</p>${nextSession.meetUrl?'<span class="glance-status">Lien Meet disponible</span>':''}</div>`;
    } else sessionShell.innerHTML = '<div class="dashboard-empty compact"><span>📅</span><p>Aucune séance future programmée.</p></div>';
    const submitted = new Set(subs.docs.map(d => d.data().homeworkId));
    const nextHomework = hs.docs.map(d => ({id:d.id, ...d.data()})).filter(relevant).filter(x => !submitted.has(x.id)).sort((a,b)=>new Date(a.dueAtIso)-new Date(b.dueAtIso))[0];
    if (nextHomework) {
      const d = new Date(nextHomework.dueAtIso);
      homeworkShell.innerHTML = `<div class="glance-icon">📝</div><div><strong>${escapeHtml(nextHomework.title || 'Devoir')}</strong><p>À rendre avant le ${d.toLocaleString('fr-FR',{day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit'})}</p><span class="glance-status warning">À faire</span></div>`;
    } else homeworkShell.innerHTML = '<div class="dashboard-empty compact"><span>✅</span><p>Aucun devoir en attente.</p></div>';
  } catch (error) {
    console.warn('Résumé séances/devoirs indisponible', error);
    sessionShell.innerHTML = '<p class="panel-subtitle">Planning indisponible.</p>';
    homeworkShell.innerHTML = '<p class="panel-subtitle">Devoirs indisponibles.</p>';
  }
}

function renderHeader(session) {
  document.getElementById('welcomeName').textContent = `Bienvenue ${session.name} 👋`;
  const sectionText = session.section ? ` · ${session.section}` : '';
  document.getElementById('profileMeta').textContent = `${session.email} · ${session.level || 'Élève'}${sectionText}`;
  document.getElementById('avatar').textContent = session.name.split(' ').filter(Boolean).map(x => x[0]).slice(0, 2).join('').toUpperCase() || 'BL';
  document.getElementById('levelBadge').textContent = `🎓 ${session.level || 'Niveau non défini'}`;
  document.getElementById('sectionBadge').textContent = `📘 ${session.section || 'Section générale'}`;
}

function renderCourseCards(courses, doneIds) {
  const shell = document.getElementById('myCourses');
  if (!courses.length) {
    shell.innerHTML = '<div class="dashboard-empty"><span>📚</span><h3>Aucun cours disponible pour ton parcours</h3><p>De nouveaux contenus seront ajoutés au fur et à mesure des séances.</p></div>';
    return;
  }
  shell.innerHTML = courses.slice(0, 6).map(course => {
    const completed = doneIds.has(String(course.id));
    return `<article class="dashboard-course-card ${completed ? 'is-completed' : ''}">
      <div class="dashboard-course-top"><span class="dashboard-course-icon">${escapeHtml(course.icon || '📘')}</span><span class="course-state ${completed ? 'done' : 'todo'}">${completed ? '✓ Terminé' : 'À faire'}</span></div>
      <div class="course-meta"><span>${escapeHtml(course.domain || 'Informatique')}</span><span>${escapeHtml(course.section || '')}</span></div>
      <h3>${escapeHtml(course.title)}</h3><p>${escapeHtml(course.description || '')}</p>
      <div class="course-progress-line"><i style="width:${completed ? 100 : 0}%"></i></div>
      <a class="btn ${completed ? 'secondary' : 'primary'}" href="course-details.html?id=${encodeURIComponent(course.id)}">${completed ? 'Revoir le cours' : 'Commencer'}</a>
    </article>`;
  }).join('');
}

function renderContinue(courses, doneIds) {
  const shell = document.getElementById('continueCourse');
  const next = courses.find(c => !doneIds.has(String(c.id)));
  if (!courses.length) {
    shell.innerHTML = '<div class="continue-empty"><span>🕐</span><h3>Contenus à venir</h3><p>Ton enseignant ajoutera bientôt des cours pour ton parcours.</p></div>';
    return;
  }
  if (!next) {
    shell.innerHTML = '<div class="continue-empty success"><span>🎉</span><h3>Bravo, parcours actuel terminé !</h3><p>Tu as terminé tous les cours actuellement disponibles.</p><a class="btn secondary" href="quiz.html">Tester mes connaissances</a></div>';
    return;
  }
  shell.innerHTML = `<div class="continue-course-icon">${escapeHtml(next.icon || '📘')}</div><div class="course-meta"><span>${escapeHtml(next.domain || 'Informatique')}</span><span>${escapeHtml(next.level)}</span></div><h3>${escapeHtml(next.title)}</h3><p>${escapeHtml(next.description || '')}</p><a class="btn primary wide" href="course-details.html?id=${encodeURIComponent(next.id)}">Continuer mon parcours →</a>`;
}

function renderQuizHistory(quiz) {
  const shell = document.getElementById('quizHistory');
  if (!quiz.length) {
    shell.innerHTML = '<div class="dashboard-empty compact"><span>📝</span><p>Aucun quiz effectué pour le moment.</p></div>';
    return;
  }
  shell.innerHTML = quiz.slice(0, 8).map(item => {
    const score = Number(item.score || 0);
    const tone = score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'retry';
    return `<div class="quiz-history-item"><div><strong>${escapeHtml(item.title || 'Quiz informatique')}</strong><small>${fmtDate(item.date || item.createdAt)}</small></div><span class="score-pill ${tone}">${score}%</span></div>`;
  }).join('');
}

function renderActivity(progress, quiz) {
  const shell = document.getElementById('recentActivity');
  const events = [
    ...progress.map(p => ({type:'course', title:p.courseTitle || p.title || 'Cours terminé', date:p.completedAt || p.date, icon:'✅', text:'Cours terminé'})),
    ...quiz.map(q => ({type:'quiz', title:q.title || 'Quiz informatique', date:q.createdAt || q.date, icon:'📝', text:`Score ${Number(q.score || 0)}%`}))
  ].sort((a,b) => toDate(b.date) - toDate(a.date)).slice(0, 10);
  if (!events.length) {
    shell.innerHTML = '<div class="dashboard-empty compact"><span>✨</span><p>Ton activité apparaîtra ici dès ton premier cours ou quiz.</p></div>';
    return;
  }
  shell.innerHTML = events.map(e => `<div class="activity-item"><span class="activity-icon">${e.icon}</span><div><strong>${escapeHtml(e.title)}</strong><small>${escapeHtml(e.text)} · ${fmtDateTime(e.date)}</small></div></div>`).join('');
}

async function renderDashboard(session) {
  const [allCourses, remoteProgress, remoteQuiz] = await Promise.all([
    loadAllCourses(), loadRemoteProgress(session.uid), loadRemoteQuiz(session.uid)
  ]);
  const eligible = allCourses.filter(c => matchesStudent(c, session));
  const localDone = localProgress(session).map(p => ({...p, courseId:p.courseId ?? p.id, courseTitle:p.courseTitle || p.title, completedAt:p.completedAt || p.date}));
  const progress = uniqueBy([...remoteProgress, ...localDone], p => String(p.courseId ?? p.id));
  const localQ = localQuiz(session).map(q => ({...q, createdAt:q.createdAt || q.date}));
  const quiz = uniqueBy([...remoteQuiz, ...localQ], q => q.id || `${q.score}_${toDate(q.createdAt || q.date).getTime()}`).sort((a,b) => toDate(b.createdAt || b.date) - toDate(a.createdAt || a.date));

  const eligibleIds = new Set(eligible.map(c => String(c.id)));
  const completedEligible = progress.filter(p => eligibleIds.has(String(p.courseId ?? p.id)));
  const doneIds = new Set(completedEligible.map(p => String(p.courseId ?? p.id)));
  const total = eligible.length;
  const completed = doneIds.size;
  const percentage = total ? Math.min(100, Math.round(completed / total * 100)) : 0;
  const best = quiz.length ? Math.max(...quiz.map(q => Number(q.score || 0))) : 0;
  const eventsForStreak = [...completedEligible, ...quiz];
  const streak = calculateStreak(eventsForStreak);

  document.getElementById('completedCount').textContent = `${completed}/${total || 0}`;
  document.getElementById('progressValue').textContent = `${percentage}%`;
  document.getElementById('quizCount').textContent = quiz.length;
  document.getElementById('bestScore').textContent = `${best}%`;
  document.getElementById('ringProgress').textContent = `${percentage}%`;
  document.getElementById('progressRing').style.setProperty('--progress', `${percentage}%`);
  document.getElementById('remainingCount').textContent = Math.max(0, total - completed);
  document.getElementById('streakValue').textContent = `${streak} jour${streak > 1 ? 's' : ''}`;
  document.getElementById('progressSentence').textContent = total
    ? `Tu as terminé ${completed} cours sur ${total} actuellement disponibles pour ton parcours.`
    : 'Aucun cours n’est encore disponible pour ton niveau et ta section.';
  document.getElementById('myCoursesSubtitle').textContent = `${total} cours disponible${total > 1 ? 's' : ''} pour ${session.level}${session.section ? ` · ${session.section}` : ''}.`;
  document.getElementById('syncBadge').textContent = (remoteProgress.length || remoteQuiz.length) ? '☁️ Synchronisé Firebase' : '💾 Sauvegarde locale + Firebase prêt';
  document.getElementById('syncBadge').classList.add('ok');

  renderCourseCards(eligible, doneIds);
  renderContinue(eligible, doneIds);
  renderQuizHistory(quiz);
  renderActivity(completedEligible, quiz);
}

function listenNotificationCount(uid) {
  if (stopNotifications) stopNotifications();
  const q = query(collection(db, 'notifications'), where('userId', '==', uid));
  stopNotifications = onSnapshot(q, snapshot => {
    const unread = snapshot.docs.filter(d => d.data().read === false).length;
    const profileCount = document.getElementById('profileNotificationCount');
    const navBadge = document.getElementById('navNotificationBadge');
    if (profileCount) profileCount.textContent = unread;
    if (navBadge) { navBadge.textContent = unread; navBadge.classList.toggle('hidden', unread === 0); }
  }, console.warn);
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    localStorage.removeItem('bl_session');
    location.href = 'login.html';
    return;
  }
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    const data = snap.exists() ? snap.data() : {};
    if (data.role !== 'admin' && data.status !== 'approved') {
      location.href = 'status.html';
      return;
    }
    const session = {
      uid: user.uid,
      name: data.name || user.email?.split('@')[0] || 'Élève',
      email: user.email,
      level: data.level || '',
      section: data.section || '',
      role: data.role || 'student',
      status: data.status || 'approved'
    };
    localStorage.setItem('bl_session', JSON.stringify(session));
    renderHeader(session);
    listenNotificationCount(user.uid);
    await Promise.all([renderDashboard(session), renderAcademicExtras(session)]);
  } catch (error) {
    console.error(error);
    location.href = 'status.html';
  }
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  if (stopNotifications) stopNotifications();
  try { await signOut(auth); } catch (error) { console.warn(error); }
  localStorage.removeItem('bl_session');
  location.href = 'login.html';
});
