import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    onSnapshot,
    deleteDoc,
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBCNacKTUsTEFyIuxS9Fky-yKzx5vjoyxs",
  authDomain: "quini-fam.firebaseapp.com",
  projectId: "quini-fam",
  storageBucket: "quini-fam.firebasestorage.app",
  messagingSenderId: "487568062317",
  appId: "1:487568062317:web:8d1c4a0ebf008d4da34c64",
  measurementId: "G-MQ6ENRH14B"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
    db,
    collection,
    getDocs,
    addDoc,
    onSnapshot,
    deleteDoc,
    doc,
    setDoc,
    getDoc
};

console.log("Firebase conectado ✅");
