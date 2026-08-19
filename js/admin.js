import { auth, db } from './firebase.js';
import {
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

let courses = JSON.parse(localStorage.getItem('bl_admin_courses') || '[]');
let students = [];
let stopStudentsListener = null;
let adminReady = false;

const form = document.getElementById('courseForm');
const list = document.getElementById('adminCourseList');
const cancel = document.getElementById('cancelEdit');
const localFile = document.getElementById('localFile');
const selectedFileName = document.getElementById('selectedFileName');
const studentList = document.getElementById('studentList');
const studentSearch = document.getElementById('studentSearch');
const studentsMessage = document.getElementById('studentsMessage');

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

function formatCreatedAt(student) {
  const value = student.createdAt;
  if (value?.toDate) return value.toDate().toLocaleString('fr-FR');
  if (student.createdAtIso) return new Date(student.createdAtIso).toLocaleString('fr-FR');
  return '—';
}

function renderStudents() {
  const term = (studentSearch?.value || '').trim().toLowerCase();
  const filtered = students.filter(s => {
    const haystack = `${s.name || ''} ${s.email || ''} ${s.level || ''} ${s.section || ''}`.toLowerCase();
    return haystack.includes(term);
  });

  document.getElementById('studentCount').textContent = students.length;
  document.getElementById('adminStudentStat').textContent = students.length;

  if (!filtered.length) {
    studentList.innerHTML = `<tr><td colspan="5" class="table-empty">${students.length ? 'Aucun résultat pour cette recherche.' : 'Aucune inscription pour le moment.'}</td></tr>`;
    return;
  }

  studentList.innerHTML = filtered.map(s => `
    <tr>
      <td><strong>${esc(s.name || 'Sans nom')}</strong></td>
      <td>${esc(s.email || '')}</td>
      <td>${esc(s.level || '—')}</td>
      <td>${esc(s.section || '—')}</td>
      <td>${esc(formatCreatedAt(s))}</td>
    </tr>
  `).join('');
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
    studentList.innerHTML = '<tr><td colspan="5" class="table-empty">Accès Firestore refusé.</td></tr>';
  });
}

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
      <div class="course-meta">
        <span>${esc(c.level)}</span>
        <span>${esc(c.section || '')}</span>
        <span>${esc(c.domain)}</span>
      </div>
      <p>${esc(c.description)}</p>
      ${c.localFileName ? `<p class="local-file-badge">📎 Fichier local : ${esc(c.localFileName)}</p>` : ''}
      ${c.pdf ? '<p class="online-file-badge">🔗 Fichier en ligne configuré</p>' : ''}
      <div class="admin-course-actions">
        <button class="btn secondary" onclick="editCourse('${c.id}')">Modifier</button>
        <button class="btn danger" onclick="deleteCourse('${c.id}')">Supprimer</button>
      </div>
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
  selectedFileName.textContent = c.localFileName
    ? `Fichier local actuel : ${c.localFileName}. Choisis un nouveau fichier uniquement pour le remplacer.`
    : 'Aucun fichier local associé.';
  document.getElementById('formTitle').textContent = 'Modifier le cours';
  cancel.classList.remove('hidden');
  scrollTo({ top: 0, behavior: 'smooth' });
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
    const adminData = adminSnap.exists() ? adminSnap.data() : null;
    if (!adminData || adminData.role !== 'admin') {
      await signOut(auth);
      localStorage.removeItem('bl_admin_session');
      location.href = 'admin-login.html';
      return;
    }

    localStorage.setItem('bl_admin_session', 'true');
    document.getElementById('adminIdentity').textContent = adminData.name || user.email || 'Administrateur';
    initCourseAdmin();
    listenToStudents();
  } catch (error) {
    console.error(error);
    location.href = 'admin-login.html';
  }
});

document.getElementById('adminLogoutBtn').addEventListener('click', async () => {
  if (stopStudentsListener) stopStudentsListener();
  try { await signOut(auth); } catch (error) { console.warn(error); }
  localStorage.removeItem('bl_admin_session');
  location.href = 'admin-login.html';
});
