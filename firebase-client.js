import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDM4sKRn8HRqrMK0f1YQF_ibtSqy9lH5E4",
  authDomain: "pilot-logbook-by-uran.firebaseapp.com",
  projectId: "pilot-logbook-by-uran",
  storageBucket: "pilot-logbook-by-uran.firebasestorage.app",
  messagingSenderId: "934416809179",
  appId: "1:934416809179:web:11c158ecd421916b80e0fe",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const BATCH_LIMIT = 450;

setPersistence(auth, browserLocalPersistence).catch(() => {});

export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGooglePopup() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export function signOutCurrentUser() {
  return signOut(auth);
}

export async function loadUserEntries(uid) {
  const entriesQuery = query(collection(db, "users", uid, "entries"), orderBy("sortOrder", "asc"));
  const snapshot = await getDocs(entriesQuery);

  return snapshot.docs.map((entryDoc) => ({
    id: entryDoc.id,
    ...entryDoc.data(),
  }));
}

export async function upsertUserEntries(uid, entries) {
  if (!entries.length) {
    return;
  }

  for (let index = 0; index < entries.length; index += BATCH_LIMIT) {
    const batch = writeBatch(db);

    entries.slice(index, index + BATCH_LIMIT).forEach((entry) => {
      const entryRef = doc(db, "users", uid, "entries", entry.id);
      batch.set(entryRef, entry, { merge: true });
    });

    await batch.commit();
  }
}

export async function deleteUserEntry(uid, entryId) {
  const entryRef = doc(db, "users", uid, "entries", entryId);
  await deleteDoc(entryRef);
}

export async function deleteUserEntries(uid, entryIds) {
  if (!entryIds.length) {
    return;
  }

  for (let index = 0; index < entryIds.length; index += BATCH_LIMIT) {
    const batch = writeBatch(db);

    entryIds.slice(index, index + BATCH_LIMIT).forEach((entryId) => {
      const entryRef = doc(db, "users", uid, "entries", entryId);
      batch.delete(entryRef);
    });

    await batch.commit();
  }
}
