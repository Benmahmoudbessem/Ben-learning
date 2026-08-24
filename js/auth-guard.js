import { auth, db } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { doc, getDoc, serverTimestamp, updateDoc } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

const currentPage = `${location.pathname.split('/').pop() || 'index.html'}${location.search || ''}`;

function redirectToLogin() {
  localStorage.removeItem('bl_session');
  const target = encodeURIComponent(currentPage);
  location.replace(`login.html?redirect=${target}`);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

async function unlockPage() {
  document.body.classList.remove('auth-checking');
  document.body.classList.add('auth-ok');
  const scripts = (document.body.dataset.protectedScripts || '')
    .split(',').map(x => x.trim()).filter(Boolean);
  for (const src of scripts) {
    try { await loadScript(src); }
    catch (error) { console.error(`Impossible de charger ${src}`, error); }
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    redirectToLogin();
    return;
  }

  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists()) {
      location.replace('status.html');
      return;
    }

    let data = snap.data();

    if (data.role === 'admin') {
      await unlockPage();
      return;
    }

    await user.reload();
    await user.getIdToken(true);

    if (!user.emailVerified) {
      location.replace('status.html');
      return;
    }

    if (data.emailVerified !== true) {
      await updateDoc(doc(db, 'users', user.uid), {
        emailVerified: true,
        emailVerifiedAt: serverTimestamp(),
        emailVerifiedAtIso: new Date().toISOString()
      });
      data = { ...data, emailVerified: true };
    }

    if (data.status !== 'approved') {
      localStorage.setItem('bl_session', JSON.stringify({
        uid: user.uid,
        name: data.name || 'Élève',
        email: user.email,
        emailVerified: true,
        level: data.level || '',
        section: data.section || '',
        role: data.role || 'student',
        status: data.status || 'pending'
      }));
      location.replace('status.html');
      return;
    }

    await unlockPage();
  } catch (error) {
    console.error(error);
    location.replace('status.html');
  }
});
