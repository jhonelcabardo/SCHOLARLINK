// firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


const firebaseConfig = {
    apiKey: "AIzaSyBt2HxSpNji-OXmAPpsvLyI1ECBLAaCVME",
    authDomain: "capstone-bdae5.firebaseapp.com",
    projectId: "capstone-bdae5",
    storageBucket: "capstone-bdae5.firebasestorage.app",
    messagingSenderId: "751990925004",
    appId: "1:751990925004:web:ff9303d9a195541e9cc469",
    measurementId: "G-V874BKCN05"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const storage = getStorage(app);


export {
    app,
    auth,
    db,
    storage
};