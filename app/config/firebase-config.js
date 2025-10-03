import firebase from "firebase/compat/app";
import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage,ref } from "firebase/storage";

export const firebaseConfig = {
  // apiKey: "AIzaSyBdrR41Al4ClHdMTe80Qo4w43GUZmDDt7A",
  // authDomain: "login-5ae9c.firebaseapp.com",
  // projectId: "login-5ae9c",
  // storageBucket: "gs://login-5ae9c.appspot.com",
  // messagingSenderId: "460691238108",
  // appId: "1:460691238108:web:b9a15b6dc6162db3d45819",
  apiKey: "AIzaSyATP-M7kCw40D_Ol7zIyzmO2QUgxJ8CMIM",
  authDomain: "finalproject-78235.firebaseapp.com",
  projectId: "finalproject-78235",
  storageBucket: "gs://finalproject-78235.appspot.com",
  messagingSenderId: "644216947432",
  appId: "1:644216947432:web:b1ce668ad29bde6d1c7f5d"
};
let app;
if (getApps.length < 1) {
  app = initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db,storage };
