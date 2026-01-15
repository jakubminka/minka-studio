
// V budoucnu zde stačí odkomentovat Firebase importy:
// import { db } from './firebaseConfig';
// import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

export interface IDBItem {
  id: string;
  [key: string]: any;
}

/**
 * UNIFIED DATA SERVICE
 * Tato třída simuluje chování Firestore. 
 * Až přejdete na cloud, stačí přepsat implementaci v těchto metodách.
 */
class DataStore {
  private getStorageKey(col: string) {
    return `jakub_minka_${col}`;
  }

  // Ekvivalent pro: collection(db, col)
  collection(col: string) {
    const key = this.getStorageKey(col);

    return {
      // Ekvivalent pro: getDocs(query)
      getAll: async (): Promise<any[]> => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
      },

      // Ekvivalent pro: setDoc(doc(db, col, id), data)
      save: async (item: any): Promise<void> => {
        const items = await this.collection(col).getAll();
        const index = items.findIndex((i: any) => i.id === item.id);
        
        let newItems;
        if (index > -1) {
          newItems = [...items];
          newItems[index] = { ...newItems[index], ...item, updatedAt: new Date().toISOString() };
        } else {
          newItems = [{ ...item, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...items];
        }
        
        localStorage.setItem(key, JSON.stringify(newItems));
        window.dispatchEvent(new Event('storage'));
      },

      // Ekvivalent pro: deleteDoc(doc(db, col, id))
      delete: async (id: string): Promise<void> => {
        const items = await this.collection(col).getAll();
        const filtered = items.filter((i: any) => i.id !== id);
        localStorage.setItem(key, JSON.stringify(filtered));
        window.dispatchEvent(new Event('storage'));
      },

      // Ekvivalent pro: updateDoc(doc(db, col, id), data)
      update: async (id: string, data: any): Promise<void> => {
        const items = await this.collection(col).getAll();
        const updated = items.map((i: any) => i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i);
        localStorage.setItem(key, JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
      }
    };
  }

  // Pro singleton dokumenty (např. nastavení webu)
  doc(col: string) {
    const key = this.getStorageKey(col);
    return {
      get: async (): Promise<any | null> => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      },
      set: async (data: any): Promise<void> => {
        localStorage.setItem(key, JSON.stringify(data));
        window.dispatchEvent(new Event('storage'));
      }
    };
  }
}

export const dataStore = new DataStore();

/**
 * MEDIA DATABASE (IndexedDB)
 * Pro velké soubory (Base64/Blobs). 
 * V budoucnu se toto propojí s Firebase Storage.
 */
export class MediaDB {
  private dbName = 'MinkaStudioDB';
  private storeName = 'media';
  private version = 2;

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(): Promise<any[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async save(item: any): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(item);
      request.onsuccess = () => {
        resolve();
        window.dispatchEvent(new Event('storage'));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);
      request.onsuccess = () => {
        resolve();
        window.dispatchEvent(new Event('storage'));
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const mediaDB = new MediaDB();
