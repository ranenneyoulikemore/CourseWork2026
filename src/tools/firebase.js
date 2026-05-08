"use strict";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyD2MPmjwqG4Zi6oUd2f8rIxxxuEO9rWG3w",
    authDomain: "mymovieapp-e5e8d.firebaseapp.com",
    projectId: "mymovieapp-e5e8d",
    storageBucket: "mymovieapp-e5e8d.firebasestorage.app",
    messagingSenderId: "9932061032",
    appId: "1:9932061032:web:7bfd4f217b8998c8e13edd",
    measurementId: "G-DQTSB12M3P"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, signOut };