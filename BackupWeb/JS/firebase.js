import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC31C1X13eqVAOq_o5K2evI8q3GOfnpOpo",
    authDomain: "iebi-2e84e.firebaseapp.com",
    projectId: "iebi-2e84e",
    storageBucket: "iebi-2e84e.firebasestorage.app",
    messagingSenderId: "634456198202",
    appId: "1:634456198202:web:8b4de1b4def23a49303903"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, serverTimestamp, doc, updateDoc };
