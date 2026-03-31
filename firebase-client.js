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

const BATCH_LIMIT = 450;

let firebaseServicesPromise;

function getEmbeddedFirebaseConfig() {
  return window.__FIREBASE_CONFIG__ ?? null;
}

async function fetchFirebaseConfig() {
  const embeddedConfig = getEmbeddedFirebaseConfig();
  if (embeddedConfig) {
    return embeddedConfig;
  }

  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    throw new Error("Firebase config is not available on this local server.");
  }

  const response = await fetch("/__/firebase/init.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Firebase config is not available from hosting.");
  }

  const config = await response.json();
  if (!config?.apiKey || !config?.projectId || !config?.appId) {
    throw new Error("Firebase config is incomplete.");
  }

  return config;
}

async function getFirebaseServices() {
  if (!firebaseServicesPromise) {
    firebaseServicesPromise = (async () => {
      const firebaseConfig = await fetchFirebaseConfig();
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const db = getFirestore(app);
      const googleProvider = new GoogleAuthProvider();

      await setPersistence(auth, browserLocalPersistence);

      return {
        app,
        auth,
        db,
        googleProvider,
      };
    })().catch((error) => {
      firebaseServicesPromise = null;
      throw error;
    });
  }

  return firebaseServicesPromise;
}

export async function subscribeToAuthState(callback) {
  try {
    const { auth } = await getFirebaseServices();
    return onAuthStateChanged(auth, callback);
  } catch (error) {
    console.warn("Firebase auth unavailable:", error);
    callback(null);
    return () => {};
  }
}

export async function signInWithGooglePopup() {
  const { auth, googleProvider } = await getFirebaseServices();
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutCurrentUser() {
  const { auth } = await getFirebaseServices();
  return signOut(auth);
}

export async function upsertUserProfile(user) {
  if (!user?.uid) {
    return;
  }

  const { db } = await getFirebaseServices();
  const profileRef = doc(db, "users", user.uid);

  await setDoc(
    profileRef,
    {
      uid: user.uid,
      displayName: user.displayName || "",
      email: user.email || "",
      photoURL: user.photoURL || "",
      providerId: user.providerData?.[0]?.providerId || "google.com",
      lastSeenAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function loadUserEntries(uid) {
  const { db } = await getFirebaseServices();
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

  const { db } = await getFirebaseServices();

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
  const { db } = await getFirebaseServices();
  const entryRef = doc(db, "users", uid, "entries", entryId);
  await deleteDoc(entryRef);
}

export async function deleteUserEntries(uid, entryIds) {
  if (!entryIds.length) {
    return;
  }

  const { db } = await getFirebaseServices();

  for (let index = 0; index < entryIds.length; index += BATCH_LIMIT) {
    const batch = writeBatch(db);

    entryIds.slice(index, index + BATCH_LIMIT).forEach((entryId) => {
      const entryRef = doc(db, "users", uid, "entries", entryId);
      batch.delete(entryRef);
    });

    await batch.commit();
  }
}
