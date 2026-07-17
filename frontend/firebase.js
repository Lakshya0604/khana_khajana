// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
    authDomain: "khana-khajana-c4281.firebaseapp.com",
    projectId: "khana-khajana-c4281",
    storageBucket: "khana-khajana-c4281.firebasestorage.app",
    messagingSenderId: "774693818792",
    appId: "1:774693818792:web:0704ede1a01b0ef87a4d9d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
export { app, auth }