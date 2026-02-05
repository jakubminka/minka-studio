
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc, query, orderBy, getDoc, enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { supabase } from '../supabaseClient';

// Tato funkce opraví tu hlášku v Dashboardu
export const checkFirestoreConnection = async () => {
  try {
    const { data, error } = await supabase.from('portfolio').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};

// POZNÁMKA: Pokud nahrávání nefunguje, zkontrolujte konzoli (F12). 
// Pravděpodobně je to způsobeno neplatným API klíčem nebo neaktivním API v Google Console.
const firebaseConfig = {
  apiKey: "AIzaSy-PLACEHOLDER", // ZDE VLOŽTE SVŮJ REÁLNÝ API KLÍČ Z FIREBASE CONSOLE
  authDomain: "minka-studio.firebaseapp.com",
  projectId: "minka-studio",
  storageBucket: "minka-studio.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

let db: any;
let storage: any;
let isFirestoreEnabled = false;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  isFirestoreEnabled = !firebaseConfig.apiKey.includes("PLACEHOLDER");
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

export { storage };

export const checkFirestoreConnection = async (): Promise<boolean> => {
  if (!isFirestoreEnabled) return false;
  try {
    const testRef = collection(db, "connection_test");
    await getDocs(testRef);
    return true;
  } catch (e) {
    return false;
  }
};

export const optimizeImage = async (file: File, quality: number = 0.8, maxWidth: number = 2000): Promise<Blob> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', quality);
      };
    };
  });
};

class DataStore {
  collection(colName: string) {
    const colRef = db ? collection(db, `jakub_minka_${colName}`) : null;
    const cacheKey = `jakub_minka_cache_${colName}`;

    return {
      getAll: async (): Promise<any[]> => {
        try {
          if (!colRef || !isFirestoreEnabled) throw new Error("Offline mode");
          const snapshot = await getDocs(colRef);
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          localStorage.setItem(cacheKey, JSON.stringify(data));
          return data;
        } catch (e) {
          console.warn(`Firestore (${colName}) unavailable, using local cache.`);
          const local = localStorage.getItem(cacheKey);
          return local ? JSON.parse(local) : [];
        }
      },
      save: async (item: any): Promise<void> => {
        try {
          const localData = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          const updatedLocal = [item, ...localData.filter((i: any) => i.id !== item.id)];
          localStorage.setItem(cacheKey, JSON.stringify(updatedLocal));

          if (db && isFirestoreEnabled) {
            const docRef = doc(db, `jakub_minka_${colName}`, item.id);
            await setDoc(docRef, { ...item, updatedAt: new Date().toISOString() }, { merge: true });
          }
        } catch (e) {
          console.error("Save error:", e);
        }
        window.dispatchEvent(new Event('storage'));
      },
      delete: async (id: string): Promise<void> => {
        try {
          const localData = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          localStorage.setItem(cacheKey, JSON.stringify(localData.filter((i: any) => i.id !== id)));

          if (db && isFirestoreEnabled) {
            await deleteDoc(doc(db, `jakub_minka_${colName}`, id));
          }
        } catch (e) {
          console.error("Delete error:", e);
        }
        window.dispatchEvent(new Event('storage'));
      },
      update: async (id: string, data: any): Promise<void> => {
        try {
          const localData = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          const updatedLocal = localData.map((i: any) => i.id === id ? { ...i, ...data } : i);
          localStorage.setItem(cacheKey, JSON.stringify(updatedLocal));

          if (db && isFirestoreEnabled) {
            await updateDoc(doc(db, `jakub_minka_${colName}`, id), { ...data, updatedAt: new Date().toISOString() });
          }
        } catch (e) {
          console.error("Update error:", e);
        }
        window.dispatchEvent(new Event('storage'));
      }
    };
  }
  doc(docId: string) {
    const cacheKey = `jakub_minka_settings_${docId}`;
    return {
      get: async () => {
        try {
          if (!db || !isFirestoreEnabled) throw new Error("Offline mode");
          const docRef = doc(db, "settings", docId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            localStorage.setItem(cacheKey, JSON.stringify(data));
            return data;
          }
          throw new Error("Doc not found");
        } catch (e) {
          return JSON.parse(localStorage.getItem(cacheKey) || '{}');
        }
      },
      set: async (data: any) => {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        try {
          if (db && isFirestoreEnabled) {
            const docRef = doc(db, "settings", docId);
            await setDoc(docRef, data, { merge: true });
          }
        } catch (e) {
          console.error("Doc set error:", e);
        }
        window.dispatchEvent(new Event('storage'));
      }
    };
  }
}

export const dataStore = new DataStore();

export class MediaDB {
  private cacheKey = 'jakub_minka_media_cache';
  async getAll(): Promise<any[]> {
    try {
      if (!db || !isFirestoreEnabled) throw new Error("Offline mode");
      const metaCol = collection(db, "media_meta");
      const snapshot = await getDocs(metaCol);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      localStorage.setItem(this.cacheKey, JSON.stringify(data));
      return data;
    } catch (e) {
      return JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    }
  }
  async save(item: any): Promise<void> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    localStorage.setItem(this.cacheKey, JSON.stringify([item, ...current]));
    
    try {
      if (db && isFirestoreEnabled) {
        await setDoc(doc(db, "media_meta", item.id), item);
      }
    } catch (e) {
      console.error("Media save error:", e);
    }
    window.dispatchEvent(new Event('storage'));
  }
  async delete(id: string): Promise<void> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    localStorage.setItem(this.cacheKey, JSON.stringify(current.filter((i: any) => i.id !== id)));

    try {
      if (db && isFirestoreEnabled) {
        await deleteDoc(doc(db, "media_meta", id));
      }
    } catch (e) {
      console.error("Media delete error:", e);
    }
    window.dispatchEvent(new Event('storage'));
  }
  async update(id: string, data: any): Promise<void> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    localStorage.setItem(this.cacheKey, JSON.stringify(current.map((i: any) => i.id === id ? { ...i, ...data } : i)));

    try {
      if (db && isFirestoreEnabled) {
        await updateDoc(doc(db, "media_meta", id), data);
      }
    } catch (e) {
      console.error("Media update error:", e);
    }
    window.dispatchEvent(new Event('storage'));
  }
}
export const mediaDB = new MediaDB();
