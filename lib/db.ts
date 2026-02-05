
import { supabase } from '../src/supabaseClient';

// Check Supabase connection
export const checkFirestoreConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('blog').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};


// Image optimization for uploads
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
  collection(tableName: string) {
    const cacheKey = `jakub_minka_cache_${tableName}`;

    return {
      getAll: async (): Promise<any[]> => {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          
          const items = data || [];
          localStorage.setItem(cacheKey, JSON.stringify(items));
          return items;
        } catch (e) {
          console.warn(`Supabase (${tableName}) unavailable, using local cache.`);
          const local = localStorage.getItem(cacheKey);
          return local ? JSON.parse(local) : [];
        }
      },

      save: async (item: any): Promise<void> => {
        try {
          const localData = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          const updatedLocal = [item, ...localData.filter((i: any) => i.id !== item.id)];
          localStorage.setItem(cacheKey, JSON.stringify(updatedLocal));

          try {
            const { error } = await supabase
              .from(tableName)
              .upsert([{ ...item, updated_at: new Date().toISOString() }], { onConflict: 'id' });
            
            if (error) throw error;
          } catch (e) {
            console.error(`Save error for ${tableName}:`, e);
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

          try {
            const { error } = await supabase
              .from(tableName)
              .delete()
              .eq('id', id);
            
            if (error) throw error;
          } catch (e) {
            console.error(`Delete error for ${tableName}:`, e);
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

          try {
            const { error } = await supabase
              .from(tableName)
              .update({ ...data, updated_at: new Date().toISOString() })
              .eq('id', id);
            
            if (error) throw error;
          } catch (e) {
            console.error(`Update error for ${tableName}:`, e);
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
          const { data, error } = await supabase
            .from('web_settings')
            .select('*')
            .eq('id', docId)
            .single();
          
          if (error) throw error;
          if (data) {
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
          const { error } = await supabase
            .from('web_settings')
            .upsert([{ id: docId, ...data, updated_at: new Date().toISOString() }], { onConflict: 'id' });
          
          if (error) throw error;
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

  // Convert camelCase to snake_case for database
  private toSnakeCase(item: any) {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      size: item.size,
      url: item.url,
      parent_id: item.parentId || null,
      specialization_id: item.specializationId || null,
      updated_at: new Date().toISOString(),
      created_at: item.created_at || new Date().toISOString()
    };
  }

  async getAll(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('media_meta')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      const items = data || [];
      localStorage.setItem(this.cacheKey, JSON.stringify(items));
      return items;
    } catch (e) {
      return JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    }
  }

  async save(item: any): Promise<void> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    localStorage.setItem(this.cacheKey, JSON.stringify([item, ...current]));
    
    try {
      const dbItem = this.toSnakeCase(item);
      const { error } = await supabase
        .from('media_meta')
        .upsert([dbItem], { onConflict: 'id' });
      
      if (error) throw error;
    } catch (e) {
      console.error("Media save error:", e);
    }
    window.dispatchEvent(new Event('storage'));
  }

  async delete(id: string): Promise<void> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    localStorage.setItem(this.cacheKey, JSON.stringify(current.filter((i: any) => i.id !== id)));

    try {
      const { error } = await supabase
        .from('media_meta')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (e) {
      console.error("Media delete error:", e);
    }
    window.dispatchEvent(new Event('storage'));
  }

  async update(id: string, data: any): Promise<void> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    localStorage.setItem(this.cacheKey, JSON.stringify(current.map((i: any) => i.id === id ? { ...i, ...data } : i)));

    try {
      const dbData = {
        ...(data.name && { name: data.name }),
        ...(data.type && { type: data.type }),
        ...(data.url && { url: data.url }),
        ...(data.parentId !== undefined && { parent_id: data.parentId }),
        ...(data.specializationId !== undefined && { specialization_id: data.specializationId }),
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase
        .from('media_meta')
        .update(dbData)
        .eq('id', id);
      
      if (error) throw error;
    } catch (e) {
      console.error("Media update error:", e);
    }
    window.dispatchEvent(new Event('storage'));
  }
}

export const mediaDB = new MediaDB();
