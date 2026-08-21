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
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

let courses = JSON.parse(localStorage.getItem('bl_admin_courses') || '[]');
let students = [];
let stopStudentsListener = null;
let stopAdminChatListener = null;
let stopUnreadChatListener = null;
let adminUser = null;
let adminProfile = null;
let selectedChatStudentId = '';
let adminReady = false;

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

function esc(v = '') {
  return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function normalizeCourse(c) {
  if (c.section) return c;
  const old = String(c.level || '');
  if (old.startsWith('Bac ')) return {...c, level:'Bac', section:old.replace('Bac ', '')};
  if (old.startsWith('3ème ')) return {...c, level:'3ème', section:old.replace('3ème ', '')};
  if (old.startsWith('2ème ')) return {...c, level:'2ème', section:old.replace('2ème ', '')};
  return {...c, section:old === '1ère' ? 'Tronc commun' : 'Informatique'};
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
    const haystack = `${s.name || ''} ${s.email || ''} ${s.level || ''} ${s.section || ''} ${label}`.toLowerCase();
    return haystack.includes(term);
  });

  const pendingCount = students.filter(s => (s.status || 'pending') === 'pending').length;
  document.getElementById('studentCount').textContent = students.length;
  document.getElementById('adminStudentStat').textContent = students.length;
  document.getElementById('adminPendingStat').textContent = pendingCount;
  updateStudentSelectors();

  if (!filtered.length) {
    studentList.innerHTML = `<tr><td colspan="6" class="table-empty">${students.length ? 'Aucun résultat pour cette recherche.' : 'Aucune inscription pour le moment.'}</td></tr>`;
    return;
  }

  studentList.innerHTML = filtered.map(s => {
    const [label, cls] = statusLabel(s.status);
    return `<tr>
      <td><strong>${esc(s.name || 'Sans nom')}</strong><small class="student-email">${esc(s.email || '')}</small></td>
      <td>${esc(s.level || '—')}</td>
      <td>${esc(s.section || '—')}</td>
      <td><span class="student-status ${cls}">${label}</span></td>
      <td>${esc(formatTimestamp(s))}</td>
      <td><div class="student-actions">
        <button class="mini-action accept" onclick="setStudentStatus('${s.id}','approved')" ${s.status === 'approved' ? 'disabled' : ''}>✓ Accepter</button>
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
    studentList.innerHTML = '<tr><td colspan="6" class="table-empty">Accès Firestore refusé.</td></tr>';
  });
}

async function sendNotification(userId, title, body, type = 'info') {
  return addDoc(collection(db, 'notifications'), {
    userId,
    title,
    body,
    type,
    read: false,
    createdBy: adminUser.uid,
    createdAt: serverTimestamp(),
    createdAtIso: new Date().toISOString()
  });
}

window.setStudentStatus = async function(id, status) {
  const student = students.find(s => s.id === id);
  if (!student) return;
  const actionText = status === 'approved' ? 'accepter' : 'refuser';
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

function listenUnreadChats() {
  if (stopUnreadChatListener) stopUnreadChatListener();
  const q = query(collection(db, 'chatMessages'), where('readByAdmin', '==', false));
  stopUnreadChatListener = onSnapshot(q, snapshot => {
    const count = snapshot.docs.filter(d => d.data().senderRole === 'student').length;
    document.getElementById('adminUnreadChatStat').textContent = count;
    document.getElementById('adminChatUnreadBadge').textContent = `${count} non lu${count > 1 ? 's' : ''}`;
  }, error => {
    console.warn('Compteur chat indisponible', error);
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
      createdAt: serverTimestamp(),
      createdAtIso: new Date().toISOString()
    });
    await sendNotification(selectedChatStudentId, 'Nouveau message 💬', 'L’administration Ben-Learning t’a répondu dans le chat.', 'chat');
    adminChatInput.value = '';
  } catch (error) {
    console.error(error);
    alert("Impossible d'envoyer le message.");
  } finally {
    button.disabled = false;
    adminChatInput.focus();
  }
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
      <div class="course-meta"><span>${esc(c.level)}</span><span>${esc(c.section || '')}</span><span>${esc(c.domain)}</span></div>
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
        domain: document.getElementById('domain').value.trim(),
        description: document.getElementById('description').value.trim(),
        pdf: document.getElementById('pdf').value.trim(),
        video: document.getElementById('video').value.trim(),
        chapters: document.getElementById('chapters').value.split('\n').map(x => x.trim()).filter(Boolean),
        exercises: oldCourse?.exercises || [],
        icon: oldCourse?.icon || '📘',
        localFileKey,
        localFileName
      };
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
  document.getElementById('domain').value = c.domain;
  document.getElementById('description').value = c.description;
  document.getElementById('pdf').value = c.pdf || '';
  document.getElementById('video').value = c.video || '';
  document.getElementById('chapters').value = (c.chapters || []).join('\n');
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
  courses = courses.filter(x => String(x.id) !== String(id));
  save();
};

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
