import React, { useState, useEffect, useRef } from 'react';
import { Project, MediaType, FileItem, GalleryItem } from '../../types';
import { SPECIALIZATIONS } from '../../constants';
import { 
  Plus, Trash2, Edit2, X, Search, Youtube, Upload, RefreshCw, CheckSquare, Square,
  GripVertical, ExternalLink, Eye, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mediaDB, dataStore, optimizeImage } from '../../lib/db';
import { supabase } from '../../src/supabaseClient';

const ProjectManagerV2: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploads, setUploads] = useState<{id: string, name: string, progress: number}[]>([]);
  
  const [allMediaItems, setAllMediaItems] = useState<FileItem[]>([]);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'thumbnail' | 'gallery'>('thumbnail');
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draggedGalleryItem = useRef<number | null>(null);

  // Form state - všechny fieldy v jednom objektu
  const [formData, setFormData] = useState<Partial<Project>>({
    title: '',
    shortDescription: '',
    description: '',
    categoryId: SPECIALIZATIONS[0].id,
    type: MediaType.BOTH,
    date: new Date().toISOString().split('T')[0],
    thumbnailUrl: '',
    thumbnailSource: 'pc',
    gallery: [],
    servicesDelivered: ''
  });

  // Load projects and media
  useEffect(() => {
    const load = async () => {
      const savedProjects = await dataStore.collection('projects').getAll();
      setProjects(savedProjects);
      const savedMedia = await mediaDB.getAll();
      setAllMediaItems(savedMedia);
    };
    load();
  }, []);

  // Image to WebP conversion with compression
  const convertToWebP = async (file: File, quality: number = 0.8): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize if too large
          const maxWidth = 2000;
          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to WebP if browser supports it
          canvas.toBlob((blob) => resolve(blob || file), 'image/webp', quality);
        };
      };
    });
  };

  // Upload file to Supabase Storage
  const uploadFileToStorage = async (file: Blob | File, fileName: string): Promise<string> => {
    const fileId = 'm-' + Math.random().toString(36).substr(2, 9);
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^/.]+$/, '.webp');
    const storagePath = `uploads/${fileId}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(storagePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('media').getPublicUrl(storagePath);
    return data.publicUrl;
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setIsProcessing(true);
    try {
      const quality = parseFloat(localStorage.getItem('jakub_minka_compression_quality') || '0.8');
      const webpBlob = await convertToWebP(file, quality);
      const url = await uploadFileToStorage(webpBlob, file.name);
      setFormData(p => ({ ...p, thumbnailUrl: url, thumbnailSource: 'storage' }));
    } catch (err) {
      alert('Error uploading thumbnail: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle gallery uploads
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    setIsProcessing(true);
    const quality = parseFloat(localStorage.getItem('jakub_minka_compression_quality') || '0.8');

    for (const file of files) {
      const uploadId = Math.random().toString(36).substr(2, 9);
      setUploads(prev => [...prev, { id: uploadId, name: file.name, progress: 0 }]);

      try {
        const webpBlob = await convertToWebP(file, quality);
        const url = await uploadFileToStorage(webpBlob, file.name);

        const galleryItem: GalleryItem = {
          id: 'g-' + uploadId,
          url,
          type: 'image',
          source: 'storage'
        };

        setFormData(p => ({
          ...p,
          gallery: [...(p.gallery || []), galleryItem]
        }));

        setUploads(prev => prev.filter(u => u.id !== uploadId));
      } catch (err) {
        console.error('Gallery upload error:', err);
        setUploads(prev => prev.filter(u => u.id !== uploadId));
      }
    }
    setIsProcessing(false);
  };

  // Add from existing media library
  const handleAddFromLibrary = () => {
    const picked = Array.from(selectedMedia.values())
      .map(id => allMediaItems.find(m => m.id === id))
      .filter(Boolean) as FileItem[];

    if (pickerMode === 'thumbnail') {
      if (picked[0]) {
        setFormData(p => ({ ...p, thumbnailUrl: picked[0]!.url, thumbnailSource: 'storage' }));
      }
    } else {
      const newGalleryItems = picked.map(m => ({
        id: m.id,
        url: m.url,
        type: m.type as any,
        source: 'storage' as const
      }));
      setFormData(p => ({ ...p, gallery: [...(p.gallery || []), ...newGalleryItems] }));
    }
    setShowMediaPicker(false);
    setSelectedMedia(new Set());
  };

  // Remove gallery item
  const removeGalleryItem = (index: number) => {
    setFormData(p => ({
      ...p,
      gallery: ((p.gallery || []).filter((_, i) => i !== index))
    }));
  };

  // Reorder gallery via drag
  const handleGalleryDragStart = (index: number) => {
    draggedGalleryItem.current = index;
  };

  const handleGalleryDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleGalleryDrop = (targetIndex: number) => {
    if (draggedGalleryItem.current === null) return;
    const gallery = [...(formData.gallery || [])];
    const [moved] = gallery.splice(draggedGalleryItem.current, 1);
    gallery.splice(targetIndex, 0, moved);
    setFormData(p => ({ ...p, gallery }));
    draggedGalleryItem.current = null;
  };

  // Save project
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert('Zadejte název projektu');
      return;
    }
    setIsProcessing(true);

    try {
      const project: Project = {
        id: editingId || 'p-' + Math.random().toString(36).substr(2, 9),
        title: formData.title,
        shortDescription: formData.shortDescription || '',
        description: formData.description || '',
        category: SPECIALIZATIONS.find(s => s.id === formData.categoryId)?.name || 'Ostatní',
        categoryId: formData.categoryId!,
        type: formData.type || MediaType.BOTH,
        date: formData.date || new Date().toISOString(),
        thumbnailUrl: formData.thumbnailUrl || '',
        thumbnailSource: formData.thumbnailSource as any || 'pc',
        gallery: formData.gallery || [],
        servicesDelivered: formData.servicesDelivered || ''
      };

      await dataStore.collection('projects').save(project);
      const updated = await dataStore.collection('projects').getAll();
      setProjects(updated);
      setShowForm(false);
      resetForm();
    } catch (err) {
      alert('Error saving project: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '',
      shortDescription: '',
      description: '',
      categoryId: SPECIALIZATIONS[0].id,
      type: MediaType.BOTH,
      date: new Date().toISOString().split('T')[0],
      thumbnailUrl: '',
      thumbnailSource: 'pc',
      gallery: [],
      servicesDelivered: ''
    });
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setFormData(project);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Smazat projekt?')) return;
    await dataStore.collection('projects').delete(id);
    const updated = await dataStore.collection('projects').getAll();
    setProjects(updated);
  };

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 border flex justify-between items-center shadow-sm">
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-[#007BFF] text-white px-8 py-3.5 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
        >
          <Plus className="inline mr-2" size={16} /> PŘIDAT ZAKÁZKU
        </button>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="HLEDAT..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-12 pr-6 py-3 border text-[10px] font-black w-64 uppercase bg-white text-black"
          />
        </div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-black text-white p-6 flex justify-between items-center">
                <h2 className="text-lg font-black uppercase">
                  {editingId ? 'Upravit zakázku' : 'Nová zakázka'}
                </h2>
                <button onClick={() => setShowForm(false)} className="hover:text-red-500">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-8">
                {/* Title & Date Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">
                      Název projektu *
                    </label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                      required
                      placeholder="Vynikající projekt"
                      className="w-full border-2 border-gray-200 p-4 font-bold text-black outline-none focus:border-[#007BFF]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">
                      Datum projektu
                    </label>
                    <input
                      type="date"
                      value={formData.date || ''}
                      onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                      className="w-full border-2 border-gray-200 p-4 font-bold text-black outline-none focus:border-[#007BFF]"
                    />
                  </div>
                </div>

                {/* Category & Type Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">
                      Specializace
                    </label>
                    <select
                      value={formData.categoryId || SPECIALIZATIONS[0].id}
                      onChange={e => setFormData(p => ({ ...p, categoryId: e.target.value }))}
                      className="w-full border-2 border-gray-200 p-4 font-bold text-black outline-none focus:border-[#007BFF]"
                    >
                      {SPECIALIZATIONS.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">
                      Typ média
                    </label>
                    <select
                      value={formData.type || MediaType.BOTH}
                      onChange={e => setFormData(p => ({ ...p, type: e.target.value as any }))}
                      className="w-full border-2 border-gray-200 p-4 font-bold text-black outline-none focus:border-[#007BFF]"
                    >
                      <option value={MediaType.BOTH}>Obrázky a video</option>
                      <option value={MediaType.IMAGE}>Jen obrázky</option>
                      <option value={MediaType.VIDEO}>Jen video</option>
                    </select>
                  </div>
                </div>

                {/* Short Description */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">
                    Krátký popis
                  </label>
                  <input
                    type="text"
                    value={formData.shortDescription || ''}
                    onChange={e => setFormData(p => ({ ...p, shortDescription: e.target.value }))}
                    placeholder="Jeden řádek popisu"
                    className="w-full border-2 border-gray-200 p-4 font-bold text-black outline-none focus:border-[#007BFF]"
                  />
                </div>

                {/* Full Description */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">
                    Popis projektu
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    placeholder="Detailní popis projektu..."
                    rows={6}
                    className="w-full border-2 border-gray-200 p-4 font-bold text-black outline-none focus:border-[#007BFF] resize-none"
                  />
                </div>

                {/* Services Delivered */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">
                    Poskytnuté služby
                  </label>
                  <input
                    type="text"
                    value={formData.servicesDelivered || ''}
                    onChange={e => setFormData(p => ({ ...p, servicesDelivered: e.target.value }))}
                    placeholder="Fotografie, editace, produkce, atd..."
                    className="w-full border-2 border-gray-200 p-4 font-bold text-black outline-none focus:border-[#007BFF]"
                  />
                </div>

                {/* Thumbnail Section */}
                <div className="border-t pt-8">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-4">Náhledový obrázek</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 p-6 rounded hover:border-[#007BFF] transition-all text-center"
                    >
                      <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-[10px] font-black uppercase">Nahrát ze souboru</p>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleThumbnailUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPickerMode('thumbnail'); setShowMediaPicker(true); }}
                      className="border-2 border-[#007BFF] p-6 rounded hover:bg-blue-50 transition-all text-center"
                    >
                      <div className="mx-auto mb-2 text-[#007BFF] text-lg">📚</div>
                      <p className="text-[10px] font-black uppercase">Z knihovny</p>
                    </button>
                    {formData.thumbnailUrl && (
                      <div className="rounded border border-gray-200 overflow-hidden">
                        <img src={formData.thumbnailUrl} alt="Thumbnail" className="w-full h-40 object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, thumbnailUrl: '' }))}
                          className="w-full bg-red-100 text-red-600 p-2 text-[10px] font-black"
                        >
                          ODEBRAT
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gallery Section */}
                <div className="border-t pt-8">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-4">Galerie projektů</h3>
                  <div className="flex gap-4 mb-6">
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.multiple = true;
                        input.accept = 'image/*,video/*';
                        input.onchange = (e) => {
                          const event = e as any;
                          handleGalleryUpload({ target: { files: event.target.files } } as any);
                        };
                        input.click();
                      }}
                      className="bg-[#007BFF] text-white px-6 py-2 text-[10px] font-black uppercase hover:bg-black transition-all"
                    >
                      <Upload size={14} className="inline mr-2" /> Přidat soubory
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPickerMode('gallery'); setShowMediaPicker(true); }}
                      className="border-2 border-[#007BFF] text-[#007BFF] px-6 py-2 text-[10px] font-black uppercase hover:bg-blue-50"
                    >
                      📚 Z knihovny
                    </button>
                  </div>

                  {/* Gallery Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {(formData.gallery || []).map((item, idx) => (
                      <motion.div
                        key={idx}
                        draggable
                        onDragStart={() => handleGalleryDragStart(idx)}
                        onDragOver={handleGalleryDragOver}
                        onDrop={() => handleGalleryDrop(idx)}
                        className="relative group cursor-move border-2 border-dashed border-gray-300 rounded overflow-hidden aspect-square bg-gray-50"
                      >
                        {item.type === 'image' ? (
                          <img src={item.url} alt="Gallery" className="w-full h-full object-cover" />
                        ) : (
                          <video src={item.url} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2">
                          <GripVertical size={16} className="text-white opacity-0 group-hover:opacity-100" />
                          <button
                            type="button"
                            onClick={() => removeGalleryItem(idx)}
                            className="bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-600"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Upload Progress */}
                  {uploads.length > 0 && (
                    <div className="mt-6 space-y-2">
                      {uploads.map(u => (
                        <div key={u.id}>
                          <p className="text-[9px] font-black uppercase text-gray-500">{u.name}</p>
                          <div className="h-1 bg-gray-200 rounded overflow-hidden">
                            <motion.div
                              className="h-full bg-[#007BFF]"
                              animate={{ width: `${u.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div className="flex gap-4 pt-8 border-t">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 bg-black text-white py-4 text-[10px] font-black uppercase hover:bg-[#007BFF] disabled:bg-gray-400"
                  >
                    {isProcessing ? <RefreshCw className="animate-spin inline mr-2" size={16} /> : '✓'}
                    ULOŽIT PROJEKT
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-8 py-4 border-2 border-gray-200 text-[10px] font-black uppercase hover:border-red-500 text-gray-600 hover:text-red-500"
                  >
                    Zrušit
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Picker Modal */}
      <AnimatePresence>
        {showMediaPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setShowMediaPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white w-full max-w-3xl max-h-[80vh] overflow-y-auto rounded-sm shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-black text-white p-6 flex justify-between items-center">
                <h2 className="text-lg font-black uppercase">Vybrat médium</h2>
                <button onClick={() => setShowMediaPicker(false)}>
                  <X size={24} />
                </button>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
                  {allMediaItems.map(item => (
                    <motion.div
                      key={item.id}
                      onClick={() => {
                        setSelectedMedia(prev => {
                          const newSet = new Set(prev);
                          newSet.has(item.id) ? newSet.delete(item.id) : newSet.add(item.id);
                          return newSet;
                        });
                      }}
                      className={`relative cursor-pointer border-2 rounded overflow-hidden aspect-square ${
                        selectedMedia.has(item.id) ? 'border-[#007BFF] bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      {item.type === 'image' ? (
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <video src={item.url} className="w-full h-full object-cover" />
                      )}
                      {selectedMedia.has(item.id) && (
                        <div className="absolute inset-0 bg-[#007BFF]/20 flex items-center justify-center">
                          <CheckSquare size={32} className="text-[#007BFF]" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleAddFromLibrary}
                    disabled={selectedMedia.size === 0}
                    className="flex-1 bg-[#007BFF] text-white py-4 text-[10px] font-black uppercase hover:bg-black disabled:bg-gray-400"
                  >
                    VYBRAT ({selectedMedia.size})
                  </button>
                  <button
                    onClick={() => setShowMediaPicker(false)}
                    className="px-8 py-4 border-2 border-gray-200 text-[10px] font-black uppercase"
                  >
                    Zrušit
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-[12px] font-black uppercase tracking-widest">Žádné projekty</p>
          </div>
        ) : (
          filteredProjects.map(project => (
            <motion.div
              key={project.id}
              layout
              className="bg-white border border-gray-200 p-6 flex gap-6 items-start"
            >
              <div className="w-24 h-24 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                {project.thumbnailUrl ? (
                  <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">Bez obrázku</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black uppercase tracking-widest mb-1">{project.title}</h3>
                <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-2">{project.category} • {new Date(project.date).toLocaleDateString('cs-CZ')}</p>
                <p className="text-sm text-gray-600 line-clamp-2">{project.shortDescription || project.description?.substring(0, 100)}</p>
                {project.gallery && (
                  <p className="text-[10px] text-gray-400 mt-2">📸 {project.gallery.length} položek v galerii</p>
                )}
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(project)}
                  className="p-2 hover:bg-blue-100 rounded text-[#007BFF]"
                  title="Upravit"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="p-2 hover:bg-red-100 rounded text-red-500"
                  title="Smazat"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectManagerV2;
