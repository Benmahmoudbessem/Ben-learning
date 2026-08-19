// OPTIONNEL — Exemple pour passer plus tard à Firebase Authentication + Firestore.
// Copie ce fichier en firebase.js puis remplace les valeurs avec la configuration
// fournie par Firebase Console. Le projet livré fonctionne déjà sans Firebase,
// grâce au mode démo localStorage.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "TA_CLE_API",
  authDomain: "TON_PROJET.firebaseapp.com",
  projectId: "TON_PROJET",
  messagingSenderId: "TON_ID",
  appId: "TON_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
