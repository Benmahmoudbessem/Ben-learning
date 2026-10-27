import { auth, db } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

function msg(text, ok = false) {
  const el = document.getElementById('authMessage');
  if (!el) return;
  el.textContent = text;
  el.style.color = ok ? '#15803d' : '#dc2626';
}

function currentLang() {
  return localStorage.getItem('bl_lang') === 'ar' ? 'ar' : 'fr';
}

const authI18n = {
  fr: {
    fillAll:'Merci de remplir tous les champs.', creatingAccount:'Création du compte…', creatingFirebase:'Création du compte Firebase…',
    accountCreated:'Compte créé ✅ Un email de vérification vient de t’être envoyé.', accountCreatedNoMail:'Compte créé, mais l’email de vérification n’a pas pu être envoyé. Tu pourras le renvoyer depuis la page suivante.',
    submitRegistration:"Envoyer ma demande d'inscription", signingIn:'Connexion…', connectingFirebase:'Connexion à Firebase…', login:'Se connecter',
    alreadyExists:'Un compte existe déjà avec cet email.', invalidEmail:"L'adresse email n'est pas valide.", weakPassword:'Le mot de passe doit contenir au moins 6 caractères.', badCredentials:'Email ou mot de passe incorrect.', network:'Problème de connexion Internet. Réessaie.', tooMany:'Trop de demandes ont été envoyées. Attends quelques minutes puis réessaie.', permissionDenied:'Accès refusé par les règles Firestore. Vérifie que les règles publiées autorisent la création du profil élève.', firebaseError:'Erreur Firebase : {message}'
  },
  ar: {
    fillAll:'يرجى ملء جميع الحقول.', creatingAccount:'جاري إنشاء الحساب…', creatingFirebase:'جاري إنشاء حساب Firebase…',
    accountCreated:'تم إنشاء الحساب ✅ وتم إرسال رسالة تحقق إلى بريدك الإلكتروني.', accountCreatedNoMail:'تم إنشاء الحساب، لكن تعذر إرسال رسالة التحقق. يمكنك إعادة الإرسال من الصفحة التالية.',
    submitRegistration:'إرسال طلب التسجيل', signingIn:'جاري تسجيل الدخول…', connectingFirebase:'جارٍ الاتصال بـ Firebase…', login:'تسجيل الدخول',
    alreadyExists:'يوجد حساب بهذا البريد الإلكتروني بالفعل.', invalidEmail:'عنوان البريد الإلكتروني غير صالح.', weakPassword:'يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل.', badCredentials:'البريد الإلكتروني أو كلمة المرور غير صحيحة.', network:'مشكلة في الاتصال بالإنترنت. حاول مرة أخرى.', tooMany:'تم إرسال طلبات كثيرة. انتظر بضع دقائق ثم حاول مرة أخرى.', permissionDenied:'تم رفض الوصول عبر قواعد Firestore. تحقق من صلاحيات إنشاء حساب التلميذ.', firebaseError:'خطأ Firebase: {message}'
  }
};

function t(key, vars = {}) {
  const lang = currentLang();
  let value = authI18n[lang]?.[key] ?? authI18n.fr[key] ?? key;
  Object.entries(vars).forEach(([name, val]) => value = value.replaceAll(`{${name}}`, val));
  return value;
}

function friendlyFirebaseError(error) {
  const code = error?.code || '';
  const messages = {
    'auth/email-already-in-use': t('alreadyExists'),
    'auth/invalid-email': t('invalidEmail'),
    'auth/weak-password': t('weakPassword'),
    'auth/invalid-credential': t('badCredentials'),
    'auth/user-not-found': t('badCredentials'),
    'auth/wrong-password': t('badCredentials'),
    'auth/network-request-failed': t('network'),
    'auth/too-many-requests': t('tooMany'),
    'permission-denied': t('permissionDenied'),
    'firestore/permission-denied': t('permissionDenied')
  };
  return messages[code] || t('firebaseError', { message: error?.message || 'operation impossible' });
}

function saveSession(user, data = {}) {
  const session = {
    uid: user.uid,
    name: data.name || user.email?.split('@')[0] || 'Utilisateur',
    email: user.email,
    emailVerified: Boolean(user.emailVerified && data.emailVerified === true),
    level: data.level || '',
    section: data.section || '',
    role: data.role || 'student',
    status: data.status || 'pending'
  };
  localStorage.setItem('bl_session', JSON.stringify(session));
  return session;
}

async function syncVerifiedEmail(user, data) {
  try {
    await user.reload();
    await user.getIdToken(true);
  } catch (error) {
    console.warn('Actualisation du compte Firebase impossible.', error);
  }

  if (user.emailVerified && data?.emailVerified !== true) {
    await updateDoc(doc(db, 'users', user.uid), {
      emailVerified: true,
      emailVerifiedAt: serverTimestamp(),
      emailVerifiedAtIso: new Date().toISOString()
    });
    return { ...data, emailVerified: true };
  }
  return data || {};
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const level = document.getElementById('studentLevel').value;
    const section = document.getElementById('studentSection').value;
    const password = document.getElementById('password').value;

    if (!name || !email || !level || !section || !password) {
      msg(t('fillAll'));
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = t('creatingAccount');
      msg(t('creatingFirebase'), true);

      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const user = credential.user;
      const profile = {
        uid: user.uid,
        name,
        email,
        emailVerified: false,
        level,
        section,
        role: 'student',
        status: 'pending',
        createdAt: serverTimestamp(),
        createdAtIso: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), profile);
      saveSession(user, profile);

      try {
        await sendEmailVerification(user);
        msg(t('accountCreated'), true);
      } catch (verificationError) {
        console.warn(verificationError);
        msg(t('accountCreatedNoMail'), true);
      }

      setTimeout(() => location.href = 'status.html', 900);
    } catch (error) {
      console.error(error);
      msg(friendlyFirebaseError(error));
      submitBtn.disabled = false;
      submitBtn.textContent = t('submitRegistration');
    }
  });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = t('signingIn');
      msg(t('connectingFirebase'), true);

      const credential = await signInWithEmailAndPassword(auth, email, password);
      const user = credential.user;
      let userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: user.email?.split('@')[0] || 'Élève',
          email: user.email,
          emailVerified: false,
          level: '',
          section: '',
          role: 'student',
          status: 'pending',
          createdAt: serverTimestamp(),
          createdAtIso: new Date().toISOString()
        });
        userDoc = await getDoc(doc(db, 'users', user.uid));
      }

      let data = userDoc.data() || {};

      if (data.role === 'admin') {
        saveSession(user, data);
        location.href = 'admin.html';
        return;
      }

      data = await syncVerifiedEmail(user, data);
      const session = saveSession(user, data);

      if (!user.emailVerified || data.emailVerified !== true) {
        location.href = 'status.html';
        return;
      }

      if (session.status !== 'approved') {
        location.href = 'status.html';
        return;
      }

      const params = new URLSearchParams(location.search);
      const requested = params.get('redirect');
      const safeRedirect = requested && !requested.includes('://') && !requested.startsWith('//')
        ? requested
        : null;
      location.href = safeRedirect || 'profile.html';
    } catch (error) {
      console.error(error);
      msg(friendlyFirebaseError(error));
      submitBtn.disabled = false;
      submitBtn.textContent = t('login');
    }
  });
}

const studentLevelSelect=document.getElementById('studentLevel');
const studentSectionSelect=document.getElementById('studentSection');
function syncStudentSection(){
  if(!studentLevelSelect||!studentSectionSelect)return;
  const isFirst=studentLevelSelect.value==='1ère';
  [...studentSectionSelect.options].forEach(o=>{if(o.value&&o.value!=='Tronc commun')o.hidden=isFirst;});
  if(isFirst){studentSectionSelect.value='Tronc commun';studentSectionSelect.disabled=true;}
  else{studentSectionSelect.disabled=false;if(studentSectionSelect.value==='Tronc commun')studentSectionSelect.value='';}
}
studentLevelSelect?.addEventListener('change',syncStudentSection);
syncStudentSection();
