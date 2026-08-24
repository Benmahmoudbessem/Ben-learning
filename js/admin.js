import { auth, db } from './firebase.js';
import {
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

let courses = JSON.parse(localStorage.getItem('bl_admin_courses') || '[]');
const REPLACED_COURSE_IDS = new Set(['premiere-production-numerique-2d-3d','premiere-production-numerique-modelisation-3d-smart-cross-road','5']);
courses = courses.filter(c => !REPLACED_COURSE_IDS.has(String(c.id)));
let students = [];
let stopStudentsListener = null;
let stopAdminChatListener = null;
let stopUnreadChatListener = null;
let adminUser = null;
let adminProfile = null;
let selectedChatStudentId = '';
let adminReady = false;
let unreadChatInitialized = false;
const knownUnreadMessageIds = new Set();

const form = document.getElementById('courseForm');
const list = document.getElementById('adminCourseList');
const cancel = document.getElementById('cancelEdit');
const localFile = document.getElementById('localFile');
const selectedFileName = document.getElementById('selectedFileName');
const studentList = document.getElementById('studentList');
const studentSearch = document.getElementById('studentSearch');
const studentsMessage = document.getElementById('studentsMessage');
const adminChatStudent = document.getElementById('adminChatStudent');
const adminChatMessages = document.getElementById('adminChatMessages');
const adminChatForm = document.getElementById('adminChatForm');
const adminChatInput = document.getElementById('adminChatInput');
const notificationTarget = document.getElementById('notificationTarget');
const notificationForm = document.getElementById('adminNotificationForm');
const adminMessageInbox = document.getElementById('adminMessageInbox');
const adminMessageInboxCount = document.getElementById('adminMessageInboxCount');
const adminMessageToast = document.getElementById('adminMessageToast');
const enableBrowserAlerts = document.getElementById('enableBrowserAlerts');

function esc(v = '') {
  return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function normalizeCourse(c) {
  if (!c) return c;
  if (!c.section) {
    const old = String(c.level || '');
    if (old.startsWith('Bac ')) c = {...c, level:'Bac', section:old.replace('Bac ', '')};
    else if (old.startsWith('3ème ')) c = {...c, level:'3ème', section:old.replace('3ème ', '')};
    else if (old.startsWith('2ème ')) c = {...c, level:'2ème', section:old.replace('2ème ', '')};
    else c = {...c, section:old === '1ère' ? 'Tronc commun' : 'Informatique'};
  }
  return {...c, trimester:String(c.trimester || '1'), resourceType:c.resourceType || 'Cours', chapter:c.chapter || (c.chapters || [])[0] || ''};
}

courses = courses.map(normalizeCourse);
localStorage.setItem('bl_admin_courses', JSON.stringify(courses));

function formatTimestamp(item) {
  const date = item?.createdAt?.toDate?.() || (item?.createdAtIso ? new Date(item.createdAtIso) : null);
  return date ? date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
}

function statusLabel(status) {
  if (status === 'approved') return ['Accepté', 'approved'];
  if (status === 'rejected') return ['Refusé', 'rejected'];
  return ['En attente', 'pending'];
}

function updateStudentSelectors() {
  const currentChat = adminChatStudent.value;
  const currentNotif = notificationTarget.value;
  const options = students.map(s => `<option value="${esc(s.id)}">${esc(s.name || s.email || 'Élève')} — ${esc(s.level || '')} ${esc(s.section || '')}</option>`).join('');
  adminChatStudent.innerHTML = `<option value="">Choisir un élève…</option>${options}`;
  notificationTarget.innerHTML = `<option value="all">Tous les élèves</option>${options}`;
  if (students.some(s => s.id === currentChat)) adminChatStudent.value = currentChat;
  if (currentNotif === 'all' || students.some(s => s.id === currentNotif)) notificationTarget.value = currentNotif;
}

function renderStudents() {
  const term = (studentSearch?.value || '').trim().toLowerCase();
  const filtered = students.filter(s => {
    const [label] = statusLabel(s.status);
    const verificationLabel = s.emailVerified === true ? 'email vérifié' : 'email non vérifié';
    const haystack = `${s.name || ''} ${s.email || ''} ${s.level || ''} ${s.section || ''} ${label} ${verificationLabel}`.toLowerCase();
    return haystack.includes(term);
  });

  const pendingCount = students.filter(s => (s.status || 'pending') === 'pending').length;
  document.getElementById('studentCount').textContent = students.length;
  document.getElementById('adminStudentStat').textContent = students.length;
  document.getElementById('adminPendingStat').textContent = pendingCount;
  updateStudentSelectors();

  if (!filtered.length) {
    studentList.innerHTML = `<tr><td colspan="7" class="table-empty">${students.length ? 'Aucun résultat pour cette recherche.' : 'Aucune inscription pour le moment.'}</td></tr>`;
    return;
  }

  studentList.innerHTML = filtered.map(s => {
    const [label, cls] = statusLabel(s.status);
    return `<tr>
      <td><strong>${esc(s.name || 'Sans nom')}</strong><small class="student-email">${esc(s.email || '')}</small></td>
      <td>${esc(s.level || '—')}</td>
      <td>${esc(s.section || '—')}</td>
      <td><span class="student-status ${s.emailVerified === true ? 'approved' : 'email-unverified'}">${s.emailVerified === true ? '✓ Vérifié' : '✉ Non vérifié'}</span></td>
      <td><span class="student-status ${cls}">${label}</span></td>
      <td>${esc(formatTimestamp(s))}</td>
      <td><div class="student-actions">
        <button class="mini-action accept" title="${s.emailVerified === true ? 'Accepter cette inscription' : 'Impossible : email non vérifié'}" onclick="setStudentStatus('${s.id}','approved')" ${(s.status === 'approved' || s.emailVerified !== true) ? 'disabled' : ''}>✓ Accepter</button>
        <button class="mini-action reject" onclick="setStudentStatus('${s.id}','rejected')" ${s.status === 'rejected' ? 'disabled' : ''}>✕ Refuser</button>
        <button class="mini-action chat" onclick="openStudentChat('${s.id}')">💬 Chat</button>
      </div></td>
    </tr>`;
  }).join('');
}

function listenToStudents() {
  if (stopStudentsListener) stopStudentsListener();
  studentsMessage.textContent = 'Synchronisation Firebase active.';
  studentsMessage.className = 'firebase-status ok';

  const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
  stopStudentsListener = onSnapshot(studentsQuery, snapshot => {
    students = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    students.sort((a, b) => {
      const da = a.createdAt?.toMillis?.() || Date.parse(a.createdAtIso || 0) || 0;
      const dbb = b.createdAt?.toMillis?.() || Date.parse(b.createdAtIso || 0) || 0;
      return dbb - da;
    });
    renderStudents();
  }, error => {
    console.error(error);
    studentsMessage.textContent = 'Impossible de lire les inscriptions. Vérifie les règles Firestore et le rôle admin.';
    studentsMessage.className = 'firebase-status error';
    studentList.innerHTML = '<tr><td colspan="7" class="table-empty">Accès Firestore refusé.</td></tr>';
  });
}

async function sendNotification(userId, title, body, type = 'info', extra = {}) {
  return addDoc(collection(db, 'notifications'), {
    userId,
    title,
    body,
    type,
    read: false,
    createdBy: adminUser.uid,
    createdAt: serverTimestamp(),
    createdAtIso: new Date().toISOString(),
    ...extra
  });
}

window.setStudentStatus = async function(id, status) {
  const student = students.find(s => s.id === id);
  if (!student) return;
  const actionText = status === 'approved' ? 'accepter' : 'refuser';
  if (status === 'approved' && student.emailVerified !== true) {
    alert("Impossible d’accepter cette inscription : l’élève n’a pas encore vérifié son adresse email.");
    return;
  }
  if (!confirm(`Confirmer : ${actionText} l’inscription de ${student.name || student.email} ?`)) return;
  try {
    await updateDoc(doc(db, 'users', id), {
      status,
      validatedAt: serverTimestamp(),
      validatedAtIso: new Date().toISOString(),
      validatedBy: adminUser.uid
    });
    if (status === 'approved') {
      await sendNotification(id, 'Inscription acceptée ✅', 'Ton inscription Ben-Learning a été validée. Tu peux maintenant accéder aux cours et aux quiz.', 'approval');
    } else {
      await sendNotification(id, 'Inscription non acceptée', 'Ta demande d’inscription n’a pas été acceptée. Tu peux contacter l’administration via le chat pour plus d’informations.', 'rejection');
    }
  } catch (error) {
    console.error(error);
    alert('Impossible de modifier le statut. Vérifie les règles Firestore.');
  }
};

function chatMessageDate(m) {
  return formatTimestamp(m) === '—' ? 'À l’instant' : formatTimestamp(m);
}

async function markConversationRead(items) {
  const unread = items.filter(m => m.senderRole === 'student' && m.readByAdmin === false);
  await Promise.all(unread.map(m => updateDoc(doc(db, 'chatMessages', m.id), { readByAdmin: true }).catch(console.warn)));
}

function renderAdminChat(items) {
  if (!items.length) {
    adminChatMessages.innerHTML = '<div class="chat-empty"><span>💬</span><p>Aucun message dans cette conversation.</p></div>';
    return;
  }
  adminChatMessages.innerHTML = items.map(m => {
    const mine = m.senderRole === 'admin';
    return `<div class="chat-row ${mine ? 'mine' : 'theirs'}"><div class="chat-bubble"><div class="chat-author">${mine ? 'Administration' : esc(m.studentName || 'Élève')}</div><p>${esc(m.text || '')}</p><small>${esc(chatMessageDate(m))}</small></div></div>`;
  }).join('');
  adminChatMessages.scrollTop = adminChatMessages.scrollHeight;
}

function listenAdminConversation(studentId) {
  if (stopAdminChatListener) stopAdminChatListener();
  selectedChatStudentId = studentId;
  const submit = adminChatForm.querySelector('button[type="submit"]');
  if (!studentId) {
    adminChatInput.disabled = true;
    submit.disabled = true;
    adminChatMessages.innerHTML = '<div class="chat-empty"><span>💬</span><p>Sélectionne un élève.</p></div>';
    return;
  }
  adminChatInput.disabled = false;
  submit.disabled = false;
  const q = query(collection(db, 'chatMessages'), where('studentId', '==', studentId));
  stopAdminChatListener = onSnapshot(q, snapshot => {
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || Date.parse(a.createdAtIso || 0) || 0;
      const tb = b.createdAt?.toMillis?.() || Date.parse(b.createdAtIso || 0) || 0;
      return ta - tb;
    });
    renderAdminChat(items);
    markConversationRead(items);
  }, error => {
    console.error(error);
    adminChatMessages.innerHTML = '<div class="chat-empty"><p>Impossible de charger cette conversation.</p></div>';
  });
}

window.openStudentChat = function(id) {
  adminChatStudent.value = id;
  listenAdminConversation(id);
  document.querySelector('.admin-chat-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

function unreadMessageTime(m) {
  const d = m.createdAt?.toDate?.() || (m.createdAtIso ? new Date(m.createdAtIso) : null);
  return d ? d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : 'À l’instant';
}

function messagePreview(text = '') {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  return clean.length > 95 ? `${clean.slice(0, 95)}…` : clean;
}

function showAdminMessageToast(message) {
  if (!adminMessageToast || !message) return;
  const studentName = message.studentName || students.find(s => s.id === message.studentId)?.name || 'Un élève';
  adminMessageToast.innerHTML = `<button type="button" class="message-toast-main" data-toast-student="${esc(message.studentId)}"><span>💬</span><div><b>Nouveau message de ${esc(studentName)}</b><small>${esc(messagePreview(message.text || ''))}</small></div></button><button type="button" class="message-toast-close" aria-label="Fermer">×</button>`;
  adminMessageToast.classList.remove('hidden');
  adminMessageToast.querySelector('[data-toast-student]')?.addEventListener('click', () => {
    window.openStudentChat(message.studentId);
    adminMessageToast.classList.add('hidden');
  });
  adminMessageToast.querySelector('.message-toast-close')?.addEventListener('click', () => adminMessageToast.classList.add('hidden'));
  clearTimeout(showAdminMessageToast.timer);
  showAdminMessageToast.timer = setTimeout(() => adminMessageToast?.classList.add('hidden'), 9000);

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const n = new Notification(`Ben-Learning · ${studentName}`, { body: messagePreview(message.text || 'Nouveau message'), icon: 'assets/icons/icon-192.png' });
      n.onclick = () => { window.focus(); window.openStudentChat(message.studentId); n.close(); };
      setTimeout(() => n.close(), 10000);
    } catch (error) { console.warn('Notification navigateur indisponible', error); }
  }
}

function renderUnreadMessageInbox(items) {
  if (!adminMessageInbox || !adminMessageInboxCount) return;
  const byStudent = new Map();
  items.forEach(m => {
    const key = m.studentId || '';
    if (!key) return;
    const prev = byStudent.get(key) || { count: 0, latest: null };
    prev.count += 1;
    const t = m.createdAt?.toMillis?.() || Date.parse(m.createdAtIso || 0) || 0;
    const pt = prev.latest ? (prev.latest.createdAt?.toMillis?.() || Date.parse(prev.latest.createdAtIso || 0) || 0) : -1;
    if (!prev.latest || t >= pt) prev.latest = m;
    byStudent.set(key, prev);
  });
  const conversations = [...byStudent.entries()].map(([studentId, data]) => ({ studentId, ...data })).sort((a,b) => {
    const ta = a.latest?.createdAt?.toMillis?.() || Date.parse(a.latest?.createdAtIso || 0) || 0;
    const tb = b.latest?.createdAt?.toMillis?.() || Date.parse(b.latest?.createdAtIso || 0) || 0;
    return tb - ta;
  });
  const count = items.length;
  adminMessageInboxCount.textContent = `${count} nouveau${count > 1 ? 'x' : ''}`;
  if (!conversations.length) {
    adminMessageInbox.innerHTML = '<div class="message-inbox-empty">✅ Aucun nouveau message. Toutes les conversations sont lues.</div>';
    return;
  }
  adminMessageInbox.innerHTML = conversations.map(c => {
    const m = c.latest || {};
    const student = students.find(s => s.id === c.studentId);
    const name = m.studentName || student?.name || student?.email || 'Élève';
    return `<button type="button" class="message-inbox-item" data-open-message="${esc(c.studentId)}"><span class="message-inbox-avatar">${esc(String(name).charAt(0).toUpperCase() || 'E')}</span><span class="message-inbox-copy"><strong>${esc(name)}</strong><small>${esc(messagePreview(m.text || ''))}</small><em>${esc(unreadMessageTime(m))}</em></span><span class="message-inbox-unread">${c.count}</span><span class="message-inbox-arrow">Ouvrir →</span></button>`;
  }).join('');
  adminMessageInbox.querySelectorAll('[data-open-message]').forEach(btn => btn.addEventListener('click', () => window.openStudentChat(btn.dataset.openMessage)));
}

function listenUnreadChats() {
  if (stopUnreadChatListener) stopUnreadChatListener();
  const q = query(collection(db, 'chatMessages'), where('readByAdmin', '==', false));
  stopUnreadChatListener = onSnapshot(q, snapshot => {
    const unreadMessages = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(m => m.senderRole === 'student');
    unreadMessages.sort((a,b) => {
      const ta = a.createdAt?.toMillis?.() || Date.parse(a.createdAtIso || 0) || 0;
      const tb = b.createdAt?.toMillis?.() || Date.parse(b.createdAtIso || 0) || 0;
      return tb - ta;
    });
    const count = unreadMessages.length;
    document.getElementById('adminUnreadChatStat').textContent = count;
    document.getElementById('adminChatUnreadBadge').textContent = `${count} non lu${count > 1 ? 's' : ''}`;
    renderUnreadMessageInbox(unreadMessages);

    const newMessages = unreadMessages.filter(m => !knownUnreadMessageIds.has(m.id));
    unreadMessages.forEach(m => knownUnreadMessageIds.add(m.id));
    if (!unreadChatInitialized) {
      unreadChatInitialized = true;
      if (unreadMessages.length) showAdminMessageToast(unreadMessages[0]);
    } else if (newMessages.length) {
      showAdminMessageToast(newMessages[0]);
    }
  }, error => {
    console.warn('Compteur chat indisponible', error);
    if (adminMessageInbox) adminMessageInbox.innerHTML = '<div class="message-inbox-empty">Impossible de charger les nouveaux messages.</div>';
  });
}

adminChatStudent?.addEventListener('change', () => listenAdminConversation(adminChatStudent.value));

adminChatForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const text = adminChatInput.value.trim();
  if (!text || !selectedChatStudentId) return;
  const student = students.find(s => s.id === selectedChatStudentId);
  const button = e.currentTarget.querySelector('button[type="submit"]');
  try {
    button.disabled = true;
    await addDoc(collection(db, 'chatMessages'), {
      studentId: selectedChatStudentId,
      studentName: student?.name || student?.email || 'Élève',
      senderId: adminUser.uid,
      senderRole: 'admin',
      text,
      readByAdmin: true,
      readByStudent: false,
      createdAt: serverTimestamp(),
      createdAtIso: new Date().toISOString()
    });
    await sendNotification(selectedChatStudentId, 'Nouveau message de l’administration 💬', `Administration : ${messagePreview(text)}`, 'chat', { actionLink: 'chat.html', senderName: 'Administration Ben-Learning' });
    adminChatInput.value = '';
  } catch (error) {
    console.error(error);
    alert("Impossible d'envoyer le message.");
  } finally {
    button.disabled = false;
    adminChatInput.focus();
  }
});

enableBrowserAlerts?.addEventListener('click', async () => {
  if (!('Notification' in window)) { alert('Les notifications navigateur ne sont pas prises en charge sur cet appareil. Les alertes dans Ben-Learning restent actives.'); return; }
  const permission = await Notification.requestPermission();
  enableBrowserAlerts.textContent = permission === 'granted' ? '✅ Alertes activées' : '🔔 Alertes refusées';
  if (permission === 'granted') enableBrowserAlerts.disabled = true;
});

notificationForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const target = notificationTarget.value;
  const title = document.getElementById('notificationTitle').value.trim();
  const body = document.getElementById('notificationBody').value.trim();
  const message = document.getElementById('notificationAdminMessage');
  const button = e.currentTarget.querySelector('button[type="submit"]');
  if (!title || !body) return;
  try {
    button.disabled = true;
    message.textContent = 'Envoi en cours…';
    message.style.color = '#64748b';
    const recipients = target === 'all' ? students : students.filter(s => s.id === target);
    if (!recipients.length) throw new Error('Aucun destinataire');
    await Promise.all(recipients.map(s => sendNotification(s.id, title, body, 'info')));
    message.textContent = `Notification envoyée à ${recipients.length} élève${recipients.length > 1 ? 's' : ''} ✅`;
    message.style.color = '#15803d';
    document.getElementById('notificationTitle').value = '';
    document.getElementById('notificationBody').value = '';
  } catch (error) {
    console.error(error);
    message.textContent = "Impossible d'envoyer la notification.";
    message.style.color = '#dc2626';
  } finally {
    button.disabled = false;
  }
});

function save() {
  localStorage.setItem('bl_admin_courses', JSON.stringify(courses));
  renderCourses();
}

function renderCourses() {
  document.getElementById('adminCourseCount').textContent = courses.length;
  document.getElementById('adminCourseStat').textContent = courses.length;
  list.innerHTML = courses.length ? courses.map(c => `
    <article class="admin-course-item">
      <h3>${esc(c.title)}</h3>
      <div class="course-meta"><span>${esc(c.level)}</span><span>${esc(c.section || '')}</span><span>T${esc(c.trimester || '1')}</span><span>${esc(c.domain)}</span><span>${esc(c.resourceType || 'Cours')}</span></div>
      <p>${esc(c.description)}</p>
      ${c.localFileName ? `<p class="local-file-badge">📎 Fichier local : ${esc(c.localFileName)}</p>` : ''}
      ${c.pdf ? '<p class="online-file-badge">🔗 Fichier en ligne configuré</p>' : ''}
      <div class="admin-course-actions"><button class="btn secondary" onclick="editCourse('${c.id}')">Modifier</button><button class="btn danger" onclick="deleteCourse('${c.id}')">Supprimer</button></div>
    </article>`).join('') : '<p>Aucun cours ajouté par l’admin pour le moment.</p>';
}

function resetForm() {
  form.reset();
  document.getElementById('editId').value = '';
  document.getElementById('formTitle').textContent = 'Ajouter un cours';
  selectedFileName.textContent = 'Aucun fichier sélectionné. Le fichier local sera enregistré dans ce navigateur.';
  cancel.classList.add('hidden');
}

function initCourseAdmin() {
  if (adminReady) return;
  adminReady = true;

  localFile.addEventListener('change', () => {
    const f = localFile.files[0];
    selectedFileName.textContent = f ? `Fichier sélectionné : ${f.name} (${(f.size / 1024 / 1024).toFixed(2)} Mo)` : 'Aucun fichier sélectionné.';
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const editId = document.getElementById('editId').value;
    const oldCourse = editId ? courses.find(c => String(c.id) === String(editId)) : null;
    const id = editId || `admin-${Date.now()}`;
    const file = localFile.files[0];
    const localFileKey = file ? `course-file-${id}` : (oldCourse?.localFileKey || '');
    const localFileName = file ? file.name : (oldCourse?.localFileName || '');

    try {
      if (file) await saveCourseFile(localFileKey, file);
      const course = {
        id,
        title: document.getElementById('title').value.trim(),
        level: document.getElementById('level').value,
        section: document.getElementById('section').value,
        trimester: document.getElementById('trimester').value,
        resourceType: document.getElementById('resourceType').value,
        domain: document.getElementById('domain').value.trim(),
        chapter: document.getElementById('chapter').value.trim(),
        description: document.getElementById('description').value.trim(),
        pdf: document.getElementById('pdf').value.trim(),
        video: document.getElementById('video').value.trim(),
        chapters: document.getElementById('chapters').value.split('\n').map(x => x.trim()).filter(Boolean),
        exercises: document.getElementById('exercises').value.split('\n').map(x => x.trim()).filter(Boolean),
        icon: oldCourse?.icon || '📘',
        localFileKey,
        localFileName
      };
      const cloudCourse = {...course, updatedAtIso:new Date().toISOString(), updatedBy:adminUser?.uid || ''};
      delete cloudCourse.localFileKey;
      await setDoc(doc(db, 'courses', String(id)), cloudCourse, {merge:true});
      if (editId) courses = courses.map(c => String(c.id) === String(editId) ? course : c);
      else courses.unshift(course);
      save();
      resetForm();
      alert(file ? 'Cours et fichier local enregistrés ✅' : 'Cours enregistré ✅');
    } catch (err) {
      console.error(err);
      alert("Impossible d'enregistrer le fichier local. Essaie avec un fichier plus petit ou utilise un lien en ligne.");
    }
  });

  cancel.addEventListener('click', resetForm);
  studentSearch?.addEventListener('input', renderStudents);
  renderCourses();
}

window.editCourse = function(id) {
  const c = courses.find(x => String(x.id) === String(id));
  if (!c) return;
  document.getElementById('editId').value = c.id;
  document.getElementById('title').value = c.title;
  document.getElementById('level').value = c.level;
  document.getElementById('section').value = c.section || 'Informatique';
  document.getElementById('trimester').value = String(c.trimester || '1');
  document.getElementById('resourceType').value = c.resourceType || 'Cours';
  document.getElementById('domain').value = c.domain;
  document.getElementById('chapter').value = c.chapter || '';
  document.getElementById('description').value = c.description;
  document.getElementById('pdf').value = c.pdf || '';
  document.getElementById('video').value = c.video || '';
  document.getElementById('chapters').value = (c.chapters || []).join('\n');
  document.getElementById('exercises').value = (c.exercises || []).join('\n');
  localFile.value = '';
  selectedFileName.textContent = c.localFileName ? `Fichier local actuel : ${c.localFileName}. Choisis un nouveau fichier uniquement pour le remplacer.` : 'Aucun fichier local associé.';
  document.getElementById('formTitle').textContent = 'Modifier le cours';
  cancel.classList.remove('hidden');
  scrollTo({ top: document.querySelector('.admin-layout').offsetTop - 90, behavior: 'smooth' });
};

window.deleteCourse = async function(id) {
  if (!confirm('Supprimer ce cours ?')) return;
  const c = courses.find(x => String(x.id) === String(id));
  try { if (c?.localFileKey) await deleteCourseFile(c.localFileKey); } catch (err) { console.warn(err); }
  try { await deleteDoc(doc(db, 'courses', String(id))); } catch (err) { console.warn('Suppression cloud impossible', err); }
  courses = courses.filter(x => String(x.id) !== String(id));
  save();
};

async function loadCloudCourses() {
  try {
    const snap = await getDocs(collection(db, 'courses'));
    const remoteAll = snap.docs.map(d => normalizeCourse({id:d.id, ...d.data()}));
    await Promise.all(remoteAll.filter(c=>REPLACED_COURSE_IDS.has(String(c.id))).map(c=>deleteDoc(doc(db,'courses',String(c.id))).catch(e=>console.warn('Nettoyage ancien cours impossible',c.id,e))));
    const remote = remoteAll.filter(c=>!REPLACED_COURSE_IDS.has(String(c.id)));
    const remoteIds = new Set(remote.map(c => String(c.id)));
    const localOnly = courses.filter(c => !remoteIds.has(String(c.id)));
    await Promise.all(localOnly.map(async c => {
      const cloud = {...normalizeCourse(c), migratedAtIso:new Date().toISOString(), migratedBy:adminUser?.uid || ''};
      delete cloud.localFileKey;
      try { await setDoc(doc(db, 'courses', String(c.id)), cloud, {merge:true}); } catch (e) { console.warn('Migration cours locale impossible', c.id, e); }
    }));
    const map = new Map(courses.map(c => [String(c.id), c]));
    remote.forEach(c => map.set(String(c.id), {...map.get(String(c.id)), ...c}));
    courses = [...map.values()];
    localStorage.setItem('bl_admin_courses', JSON.stringify(courses));
    renderCourses();
  } catch (error) {
    console.warn('Impossible de charger les cours Firestore', error);
  }
}

onAuthStateChanged(auth, async user => {
  if (!user) {
    localStorage.removeItem('bl_admin_session');
    location.href = 'admin-login.html';
    return;
  }
  try {
    const adminSnap = await getDoc(doc(db, 'users', user.uid));
    const data = adminSnap.exists() ? adminSnap.data() : null;
    if (!data || data.role !== 'admin') {
      await signOut(auth);
      localStorage.removeItem('bl_admin_session');
      location.href = 'admin-login.html';
      return;
    }
    adminUser = user;
    adminProfile = data;
    localStorage.setItem('bl_admin_session', 'true');
    document.getElementById('adminIdentity').textContent = data.name || user.email || 'Administrateur';
    initCourseAdmin();
    await loadCloudCourses();
    listenToStudents();
    listenUnreadChats();
  } catch (error) {
    console.error(error);
    location.href = 'admin-login.html';
  }
});

document.getElementById('adminLogoutBtn').addEventListener('click', async () => {
  if (stopStudentsListener) stopStudentsListener();
  if (stopAdminChatListener) stopAdminChatListener();
  if (stopUnreadChatListener) stopUnreadChatListener();
  try { await signOut(auth); } catch (error) { console.warn(error); }
  localStorage.removeItem('bl_admin_session');
  location.href = 'admin-login.html';
});
