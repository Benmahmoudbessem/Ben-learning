import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

let currentUser = null;
let stopNotifications = null;

function esc(v = '') {
  return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function fmtDate(item) {
  const date = item.createdAt?.toDate?.() || (item.createdAtIso ? new Date(item.createdAtIso) : null);
  return date ? date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : 'À l’instant';
}

function iconFor(type) {
  return { approval: '✅', rejection: '❌', info: 'ℹ️', chat: '💬', course: '📚' }[type] || '🔔';
}

function render(items) {
  const box = document.getElementById('notificationList');
  const unread = items.filter(x => !x.read).length;
  document.getElementById('notificationUnread').textContent = unread;
  if (!items.length) {
    box.innerHTML = '<div class="notification-empty"><span>🔕</span><h3>Aucune notification</h3><p>Les messages importants de Ben-Learning apparaîtront ici.</p></div>';
    return;
  }
  box.innerHTML = items.map(n => `<article class="notification-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
    <div class="notification-icon">${iconFor(n.type)}</div>
    <div class="notification-content"><div class="notification-title-row"><h3>${esc(n.title || 'Notification')}</h3>${n.read ? '' : '<span>Nouveau</span>'}</div><p>${esc(n.body || '')}</p><small>${esc(fmtDate(n))}</small></div>
    ${n.read ? '' : `<button class="notification-read-btn" data-read-id="${n.id}">Marquer comme lue</button>`}
  </article>`).join('');

  box.querySelectorAll('[data-read-id]').forEach(btn => btn.addEventListener('click', async () => {
    try { await updateDoc(doc(db, 'notifications', btn.dataset.readId), { read: true }); }
    catch (error) { console.error(error); }
  }));
}

onAuthStateChanged(auth, user => {
  if (!user) {
    location.href = 'login.html';
    return;
  }
  currentUser = user;
  const q = query(collection(db, 'notifications'), where('userId', '==', user.uid));
  stopNotifications = onSnapshot(q, snapshot => {
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || Date.parse(a.createdAtIso || 0) || 0;
      const tb = b.createdAt?.toMillis?.() || Date.parse(b.createdAtIso || 0) || 0;
      return tb - ta;
    });
    render(items);
  }, error => {
    console.error(error);
    document.getElementById('notificationList').innerHTML = '<div class="notification-empty"><p>Impossible de charger les notifications. Vérifie les règles Firestore.</p></div>';
  });
});

document.getElementById('markAllRead')?.addEventListener('click', async () => {
  const buttons = [...document.querySelectorAll('[data-read-id]')];
  await Promise.all(buttons.map(btn => updateDoc(doc(db, 'notifications', btn.dataset.readId), { read: true }).catch(console.error)));
});

document.getElementById('notificationsLogoutBtn')?.addEventListener('click', async () => {
  if (stopNotifications) stopNotifications();
  try { await signOut(auth); } catch (error) { console.warn(error); }
  localStorage.removeItem('bl_session');
  location.href = 'login.html';
});
