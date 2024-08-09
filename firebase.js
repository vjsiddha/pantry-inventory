import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCCG_jOgeIA-MYkOxTBAH23NqVChEUzMJI",
  authDomain: "inventory-management-hsai.firebaseapp.com",
  projectId: "inventory-management-hsai",
  storageBucket: "inventory-management-hsai.appspot.com",
  messagingSenderId: "920082440293",
  appId: "1:920082440293:web:f853a877e62cd4af5de68c",
  measurementId: "G-ZJ0BSC77ZD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const storage = getStorage(app);

let analytics;
if (typeof window !== "undefined") {
  import("firebase/analytics").then(({ getAnalytics }) => {
    analytics = getAnalytics(app);
  });
}

export { firestore, storage, analytics };
