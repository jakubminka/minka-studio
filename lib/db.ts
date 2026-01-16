
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSy...", 
  authDomain: "minka-studio.firebaseapp.com",
  projectId: "minka-studio",
  storageBucket: "minka-studio.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export const storage = getStorage(app);

// --- IMAGE OPTIMIZATION ---
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
    const colRef = collection(db, `jakub_minka_${colName}`);
    return {
      getAll: async (): Promise<any[]> => {
        try {
          const q = query(colRef, orderBy("updatedAt", "desc"));
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
          const snapshot = await getDocs(colRef);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      },
      save: async (item: any): Promise<void> => {
        const docRef = doc(db, `jakub_minka_${colName}`, item.id);
        await setDoc(docRef, { ...item, updatedAt: new Date().toISOString() }, { merge: true });
        window.dispatchEvent(new Event('storage'));
      },
      delete: async (id: string): Promise<void> => {
        await deleteDoc(doc(db, `jakub_minka_${colName}`, id));
        window.dispatchEvent(new Event('storage'));
      },
      update: async (id: string, data: any): Promise<void> => {
        await updateDoc(doc(db, `jakub_minka_${colName}`, id), { ...data, updatedAt: new Date().toISOString() });
        window.dispatchEvent(new Event('storage'));
      }
    };
  }
  doc(colName: string) {
    return {
      get: async () => {
        const snapshot = await getDocs(collection(db, "settings"));
        return snapshot.docs.find(d => d.id === colName)?.data() || null;
      },
      set: async (data: any) => {
        await setDoc(doc(db, "settings", colName), data, { merge: true });
        window.dispatchEvent(new Event('storage'));
      }
    };
  }
}

export const dataStore = new DataStore();

export class MediaDB {
  private metaCol = collection(db, "media_meta");
  async getAll(): Promise<any[]> {
    const snapshot = await getDocs(this.metaCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  async save(item: any): Promise<void> {
    await setDoc(doc(db, "media_meta", item.id), item);
    window.dispatchEvent(new Event('storage'));
  }
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "media_meta", id));
    window.dispatchEvent(new Event('storage'));
  }
  async update(id: string, data: any): Promise<void> {
    await updateDoc(doc(db, "media_meta", id), data);
    window.dispatchEvent(new Event('storage'));
  }
}
export const mediaDB = new MediaDB();
