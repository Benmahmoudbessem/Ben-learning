import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

let currentUser = null;
let currentProfile = null;
let stopMessages = null;

function esc(v = '') {
  return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function fmtDate(msg) {
  const date = msg.createdAt?.toDate?.() || (msg.createdAtIso ? new Date(msg.createdAtIso) : null);
  return date ? date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : 'À l’instant';
}

function renderMessages(items) {
  const box = document.getElementById('chatMessages');
  if (!items.length) {
    box.innerHTML = '<div class="chat-empty"><span>💬</span><p>Aucun message pour le moment. Écris à l’administration.</p></div>';
    return;
  }
  box.innerHTML = items.map(m => {
    const mine = m.senderId === currentUser.uid;
    return `<div class="chat-row ${mine ? 'mine' : 'theirs'}">
      <div class="chat-bubble">
        <div class="chat-author">${mine ? 'Vous' : 'Administration'}</div>
        <p>${esc(m.text || '')}</p>
        <small>${esc(fmtDate(m))}</small>
      </div>
    </div>`;
  }).join('');
  box.scrollTop = box.scrollHeight;
}

async function markChatNotificationsRead() {
  if (!currentUser) return;
  try {
    const q = query(collection(db, 'notifications'), where('userId', '==', currentUser.uid));
    const snap = await getDocs(q);
    const unreadChat = snap.docs.filter(d => {
      const n = d.data();
      return n.type === 'chat' && n.read === false;
    });
    await Promise.all(unreadChat.map(d => updateDoc(doc(db, 'notifications', d.id), { read: true }).catch(console.warn)));
  } catch (error) { console.warn('Lecture des notifications chat impossible', error); }
}

function listenMessages() {
  if (stopMessages) stopMessages();
  const q = query(collection(db, 'chatMessages'), where('studentId', '==', currentUser.uid));
  stopMessages = onSnapshot(q, snapshot => {
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || Date.parse(a.createdAtIso || 0) || 0;
      const tb = b.createdAt?.toMillis?.() || Date.parse(b.createdAtIso || 0) || 0;
      return ta - tb;
    });
    renderMessages(items);
  }, error => {
    console.error(error);
    document.getElementById('chatMessages').innerHTML = '<div class="chat-empty"><p>Impossible de charger le chat. Vérifie les règles Firestore.</p></div>';
  });
}

onAuthStateChanged(auth, async user => {
  if (!user) {
    location.href = 'login.html';
    return;
  }
  await user.reload();
  await user.getIdToken(true);
  if (!user.emailVerified) {
    location.href = 'status.html';
    return;
  }

  currentUser = user;
  const snap = await getDoc(doc(db, 'users', user.uid));
  if (!snap.exists()) {
    location.href = 'status.html';
    return;
  }
  currentProfile = snap.data();
  if (currentProfile.role === 'admin') {
    location.href = 'admin.html';
    return;
  }
  document.getElementById('chatStudentName').textContent = currentProfile.name || user.email || 'Élève';
  listenMessages();
  markChatNotificationsRead();
});

document.getElementById('chatForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text || !currentUser) return;
  const button = e.currentTarget.querySelector('button[type="submit"]');
  try {
    button.disabled = true;
    await addDoc(collection(db, 'chatMessages'), {
      studentId: currentUser.uid,
      studentName: currentProfile?.name || currentUser.email || 'Élève',
      senderId: currentUser.uid,
      senderRole: 'student',
      text,
      readByAdmin: false,
      createdAt: serverTimestamp(),
      createdAtIso: new Date().toISOString()
    });
    input.value = '';
  } catch (error) {
    console.error(error);
    alert("Impossible d'envoyer le message. Vérifie les règles Firestore.");
  } finally {
    button.disabled = false;
    input.focus();
  }
});

document.getElementById('chatLogoutBtn')?.addEventListener('click', async () => {
  if (stopMessages) stopMessages();
  try { await signOut(auth); } catch (error) { console.warn(error); }
  localStorage.removeItem('bl_session');
  location.href = 'login.html';
});
