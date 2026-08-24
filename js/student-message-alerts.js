import { auth, db } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

let stopAlerts = null;
let initialized = false;
const knownIds = new Set();

function esc(v = '') {
  return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function preview(text = '') {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  return clean.length > 105 ? `${clean.slice(0, 105)}…` : clean;
}

function showToast(notification) {
  if (!notification || location.pathname.endsWith('/chat.html') || location.pathname.endsWith('/notifications.html')) return;
  let toast = document.getElementById('studentMessageToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'studentMessageToast';
    toast.className = 'message-toast hidden';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<button type="button" class="message-toast-main" data-open-student-chat><span>💬</span><div><b>${esc(notification.title || 'Nouveau message de l’administration')}</b><small>${esc(preview(notification.body || 'Ouvre le chat pour lire le message.'))}</small></div></button><button type="button" class="message-toast-close" aria-label="Fermer">×</button>`;
  toast.classList.remove('hidden');
  toast.querySelector('[data-open-student-chat]')?.addEventListener('click', async () => {
    try { await updateDoc(doc(db, 'notifications', notification.id), { read: true }); } catch (error) { console.warn(error); }
    location.href = 'chat.html';
  });
  toast.querySelector('.message-toast-close')?.addEventListener('click', () => toast.classList.add('hidden'));
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add('hidden'), 9000);
}

onAuthStateChanged(auth, user => {
  if (stopAlerts) { stopAlerts(); stopAlerts = null; }
  if (!user) return;
  const q = query(collection(db, 'notifications'), where('userId', '==', user.uid));
  stopAlerts = onSnapshot(q, snapshot => {
    const chatUnread = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(n => n.type === 'chat' && n.read === false)
      .sort((a,b) => {
        const ta = a.createdAt?.toMillis?.() || Date.parse(a.createdAtIso || 0) || 0;
        const tb = b.createdAt?.toMillis?.() || Date.parse(b.createdAtIso || 0) || 0;
        return tb - ta;
      });
    const newItems = chatUnread.filter(n => !knownIds.has(n.id));
    chatUnread.forEach(n => knownIds.add(n.id));
    if (!initialized) {
      initialized = true;
      if (chatUnread.length) showToast(chatUnread[0]);
    } else if (newItems.length) {
      showToast(newItems[0]);
    }
  }, error => console.warn('Alertes messages indisponibles', error));
});
