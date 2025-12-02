import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCoU-QB5hs1_GUs2T3XQQ4VWdf4LkZBCWs",
  authDomain: "thaparolx-ccde5.firebaseapp.com",
  projectId: "thaparolx-ccde5",
  storageBucket: "thaparolx-ccde5.firebasestorage.app",
  messagingSenderId: "384986132684",
  appId: "1:384986132684:web:ff1f1d69c33dd5a83f9269"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
