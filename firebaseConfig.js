import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDaYsZqb8K6tOrz8FtB66AZseVNuk-v6mQ",
  authDomain: "santiyem-erp.firebaseapp.com",
  databaseURL: "https://santiyem-erp-default-rtdb.firebaseio.com",
  projectId: "santiyem-erp",
  storageBucket: "santiyem-erp.firebasestorage.app",
  messagingSenderId: "778377970571",
  appId: "1:778377970571:web:ed5bf889c300305999258e"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);