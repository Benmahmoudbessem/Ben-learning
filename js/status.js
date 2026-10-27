import { auth, db } from './firebase.js';
import {
  onAuthStateChanged,
  signOut,
  sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import {
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

let stopUser = null;
let currentProfile = null;
let resendCooldown = 0;

function getLang() {
  return localStorage.getItem('bl_lang') === 'ar' ? 'ar' : 'fr';
}

const statusI18n = {
  fr: {
    student:'Élève', badgeEmail:'Email à vérifier', titleCheck:'Vérifie ton adresse email', textCheck:'Un lien de vérification a été envoyé à ton adresse. Clique sur ce lien, puis reviens ici et appuie sur « J’ai vérifié mon email ».',
    badgeApproved:'Inscription acceptée', titleApproved:'Ton inscription est validée !', textApproved:'Ton email est vérifié et l’administration a accepté ton inscription. Tu peux accéder à tout Ben-Learning.',
    badgeRejected:'Inscription refusée', titleRejected:'Ta demande n’a pas été acceptée', textRejected:'Ton email est bien vérifié. Tu peux contacter l’administration pour demander plus d’informations.',
    badgePending:'Email vérifié · validation en attente', titlePending:'Email vérifié ✅', textPending:'Ton adresse email est valide. L’administrateur doit maintenant valider ton inscription avant l’accès aux cours et aux quiz.',
    statusError:'Impossible de vérifier le statut. Vérifie ta connexion puis réessaie.', checking:'Vérification…', verifiedNow:'Email vérifié ✅ Ta demande peut maintenant être validée par l’administration.', notYet:'Ton email n’est pas encore vérifié. Ouvre le message Firebase reçu dans ta boîte mail et clique sur le lien.', verifyError:'Impossible de vérifier maintenant. Réessaie dans quelques instants.', verifiedButton:'✅ J’ai vérifié mon email', resent:'Un nouvel email de vérification a été envoyé ✅', resendIn:'Renvoyer dans {seconds}s', resendButton:'📨 Renvoyer l’email', tooMany:'Trop de demandes. Attends quelques minutes avant de renvoyer un email.', sendError:"Impossible d'envoyer l'email de vérification pour le moment."
  },
  ar: {
    student:'تلميذ', badgeEmail:'التحقق من البريد', titleCheck:'تحقق من بريدك الإلكتروني', textCheck:'تم إرسال رابط التحقق إلى بريدك الإلكتروني. اضغط على الرابط ثم ارجع إلى هنا واضغط على « لقد تحققت من بريدي الإلكتروني ».',
    badgeApproved:'تم قبول التسجيل', titleApproved:'تمت المصادقة على تسجيلك!', textApproved:'تم التحقق من بريدك الإلكتروني ووافقت الإدارة على تسجيلك. يمكنك الآن الوصول إلى كامل Ben-Learning.',
    badgeRejected:'تم رفض التسجيل', titleRejected:'لم يتم قبول طلبك', textRejected:'تم التحقق من بريدك الإلكتروني. يمكنك الاتصال بالإدارة لطلب المزيد من المعلومات.',
    badgePending:'تم التحقق من البريد · في انتظار الموافقة', titlePending:'تم التحقق من البريد ✅', textPending:'بريدك الإلكتروني صالح. يجب على الإدارة الآن المصادقة على تسجيلك قبل الوصول إلى الدروس والاختبارات.',
    statusError:'تعذر التحقق من الحالة. تحقق من اتصالك ثم أعد المحاولة.', checking:'جارٍ التحقق…', verifiedNow:'تم التحقق من البريد ✅ يمكن الآن للإدارة المصادقة على طلبك.', notYet:'لم يتم التحقق من بريدك بعد. افتح رسالة Firebase في بريدك الإلكتروني واضغط على الرابط.', verifyError:'تعذر التحقق الآن. أعد المحاولة بعد قليل.', verifiedButton:'✅ لقد تحققت من بريدي', resent:'تم إرسال رسالة تحقق جديدة ✅', resendIn:'إعادة الإرسال خلال {seconds}ث', resendButton:'📨 إعادة إرسال البريد', tooMany:'طلبات كثيرة. انتظر بضع دقائق قبل إعادة الإرسال.', sendError:'تعذر إرسال رسالة التحقق في الوقت الحالي.'
  }
};

function t(key, vars = {}) {
  const lang = getLang();
  let value = statusI18n[lang]?.[key] ?? statusI18n.fr[key] ?? key;
  Object.entries(vars).forEach(([name, val]) => value = value.replaceAll(`{${name}}`, val));
  return value;
}

function setVerificationMessage(text, ok = false) {
  const el = document.getElementById('verificationMessage');
  if (!el) return;
  el.textContent = text;
  el.style.color = ok ? '#15803d' : '#dc2626';
}

async function syncEmailVerification(user) {
  await user.reload();
  await user.getIdToken(true);

  if (user.emailVerified && currentProfile?.emailVerified !== true) {
    await updateDoc(doc(db, 'users', user.uid), {
      emailVerified: true,
      emailVerifiedAt: serverTimestamp(),
      emailVerifiedAtIso: new Date().toISOString()
    });
    currentProfile = { ...currentProfile, emailVerified: true };
  }

  return Boolean(user.emailVerified && currentProfile?.emailVerified === true);
}

function updateSteps(emailVerified, status) {
  const accountStep = document.getElementById('stepAccount');
  const emailStep = document.getElementById('stepEmail');
  const adminStep = document.getElementById('stepAdmin');
  const accessStep = document.getElementById('stepAccess');

  accountStep?.classList.add('done');
  emailStep?.classList.toggle('done', emailVerified);
  adminStep?.classList.toggle('done', emailVerified && status === 'approved');
  accessStep?.classList.toggle('done', emailVerified && status === 'approved');
}

function renderStatus(data, emailVerified) {
  const icon = document.getElementById('statusIcon');
  const title = document.getElementById('statusTitle');
  const text = document.getElementById('statusText');
  const badge = document.getElementById('statusBadge');
  const approvedActions = document.getElementById('approvedActions');
  const verifiedContactActions = document.getElementById('verifiedContactActions');
  const verificationActions = document.getElementById('verificationActions');
  const studentName = document.getElementById('statusName');
  const emailText = document.getElementById('statusEmail');

  studentName.textContent = data.name || t('student');
  emailText.textContent = data.email || auth.currentUser?.email || '';
  const status = data.status || 'pending';

  updateSteps(emailVerified, status);

  if (!emailVerified) {
    icon.textContent = '📧';
    badge.className = 'approval-badge email-pending';
    badge.textContent = t('badgeEmail');
    title.textContent = t('titleCheck');
    text.textContent = t('textCheck');
    approvedActions.classList.add('hidden');
    verifiedContactActions.classList.add('hidden');
    verificationActions.classList.remove('hidden');
  } else {
    verificationActions.classList.add('hidden');
    verifiedContactActions.classList.remove('hidden');

    if (status === 'approved') {
      icon.textContent = '✅';
      badge.className = 'approval-badge approved';
      badge.textContent = t('badgeApproved');
      title.textContent = t('titleApproved');
      text.textContent = t('textApproved');
      approvedActions.classList.remove('hidden');
    } else if (status === 'rejected') {
      icon.textContent = '❌';
      badge.className = 'approval-badge rejected';
      badge.textContent = t('badgeRejected');
      title.textContent = t('titleRejected');
      text.textContent = t('textRejected');
      approvedActions.classList.add('hidden');
    } else {
      icon.textContent = '⏳';
      badge.className = 'approval-badge pending';
      badge.textContent = t('badgePending');
      title.textContent = t('titlePending');
      text.textContent = t('textPending');
      approvedActions.classList.add('hidden');
    }
  }

  const session = {
    uid: data.uid || auth.currentUser?.uid,
    name: data.name || 'Élève',
    email: data.email || auth.currentUser?.email || '',
    emailVerified,
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

  stopUser = onSnapshot(doc(db, 'users', user.uid), async snap => {
    if (!snap.exists()) return;
    currentProfile = { uid: user.uid, ...snap.data() };

    if (currentProfile.role === 'admin') {
      location.href = 'admin.html';
      return;
    }

    try {
      const emailVerified = await syncEmailVerification(user);
      renderStatus(currentProfile, emailVerified);
    } catch (error) {
      console.error(error);
      renderStatus(currentProfile, Boolean(user.emailVerified && currentProfile.emailVerified === true));
    }
  }, error => {
    console.error(error);
    document.getElementById('statusText').textContent = t('statusError');
  });
});

document.getElementById('checkVerificationBtn')?.addEventListener('click', async () => {
  const user = auth.currentUser;
  if (!user) return;
  const btn = document.getElementById('checkVerificationBtn');

  try {
    btn.disabled = true;
    btn.textContent = t('checking');
    const verified = await syncEmailVerification(user);

    if (verified) {
      setVerificationMessage(t('verifiedNow'), true);
      renderStatus(currentProfile, true);
    } else {
      setVerificationMessage(t('notYet'));
    }
  } catch (error) {
    console.error(error);
    setVerificationMessage(t('verifyError'));
  } finally {
    btn.disabled = false;
    btn.textContent = t('verifiedButton');
  }
});

document.getElementById('resendVerificationBtn')?.addEventListener('click', async () => {
  const user = auth.currentUser;
  if (!user || resendCooldown > 0) return;
  const btn = document.getElementById('resendVerificationBtn');

  try {
    btn.disabled = true;
    await sendEmailVerification(user);
    setVerificationMessage(t('resent'), true);

    resendCooldown = 60;
    const timer = setInterval(() => {
      resendCooldown -= 1;
      btn.textContent = resendCooldown > 0
        ? t('resendIn', { seconds: resendCooldown })
        : t('resendButton');
      if (resendCooldown <= 0) {
        clearInterval(timer);
        btn.disabled = false;
      }
    }, 1000);
  } catch (error) {
    console.error(error);
    btn.disabled = false;
    btn.textContent = t('resendButton');
    if (error?.code === 'auth/too-many-requests') {
      setVerificationMessage(t('tooMany'));
    } else {
      setVerificationMessage(t('sendError'));
    }
  }
});

document.getElementById('statusLogoutBtn')?.addEventListener('click', async () => {
  if (stopUser) stopUser();
  try { await signOut(auth); } catch (error) { console.warn(error); }
  localStorage.removeItem('bl_session');
  location.href = 'login.html';
});
