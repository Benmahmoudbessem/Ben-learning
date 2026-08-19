import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDfjPY4CcYnUO1WueOck8hlvt1BXv8OM6A",
  authDomain: "ben-mahmoud-learning.firebaseapp.com",
  projectId: "ben-mahmoud-learning",
  storageBucket: "ben-mahmoud-learning.firebasestorage.app",
  messagingSenderId: "580727403293",
  appId: "1:580727403293:web:dda021ec1bf3b52304e7f4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
