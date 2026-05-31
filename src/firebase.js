import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDglMFEg2EefiFUeIQ14qd5GKO1XPUJS4c",
  authDomain: "portal-ceti.firebaseapp.com",
  projectId: "portal-ceti",
  storageBucket: "portal-ceti.firebasestorage.app",
  messagingSenderId: "46160045580",
  appId: "1:46160045580:web:75865f30d86c21170df029"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;