
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Folder, ImageIcon, Video as VideoIcon, Upload, Plus, ChevronRight, ChevronLeft,
  Trash2, Grid, List as ListIcon, Search, X, HardDrive, RefreshCw,
  Edit2, FolderPlus, MoreVertical, Move, FolderTree, CheckSquare, Square,
  Tag, Info, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileItem } from '../../types';
import { mediaDB, storage, optimizeImage } from '../../lib/db';
import { SPECIALIZATIONS } from '../../constants';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const FileManager: React.FC = () => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [items, setItems] = useState<FileItem[]>([]);
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    const dbItems = await mediaDB.getAll();
    setItems(dbItems.map(i => ({...i, parentId: i.parentId || null})));
  };

  useEffect(() => {
    loadFiles();
    window.addEventListener('storage', loadFiles);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewItem) return;
      if (e.key === 'ArrowRight') navigatePreview(1);
      if (e.key === 'ArrowLeft') navigatePreview(-1);
      if (e.key === 'Escape') setPreviewItem(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('storage', loadFiles);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewItem, items, currentFolderId]);

  const navigatePreview = (direction: number) => {
    const siblings = currentItems.filter(i => i.type !== 'folder');
    const currentIndex = siblings.findIndex(s => s.id === previewItem?.id);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + direction + siblings.length) % siblings.length;
    setPreviewItem(siblings[nextIndex]);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    const quality = parseFloat(localStorage.getItem('jakub_minka_compression_quality') || '0.8');

    for (let i = 0; i < files.length; i++) {
      let fileToUpload: Blob | File = files[i];
      if (fileToUpload.type.startsWith('image/')) {
        fileToUpload = await optimizeImage(files[i], quality / 100);
      }
      
      const fileId = 'm-' + Math.random().toString(36).substr(2, 9);
      const storagePath = `uploads/${fileId}_${files[i].name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject,
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            const newItem: FileItem = {
              id: fileId, name: files[i].name,
              type: files[i].type.startsWith('image') ? 'image' : files[i].type.startsWith('video') ? 'video' : 'other',
              size: `${(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB`,
              updatedAt: new Date().toISOString(), url, parentId: currentFolderId, specializationId: storagePath
            };
            await mediaDB.save(newItem);
            resolve(true);
          }
        );
      });
    }
    await loadFiles();
    setIsProcessing(false);
    setUploadProgress(0);
  };

  const deleteBulk = async () => {
    if (!confirm(`Smazat vybraných ${selectedIds.size} položek?`)) return;
    setIsProcessing(true);
    for (const id of selectedIds) {
      const item = items.find(i => i.id === id);
      if (item?.type !== 'folder' && item?.specializationId) {
        try { await deleteObject(ref(storage, item.specializationId)); } catch (e) {}
      }
      await mediaDB.delete(id);
    }
    setSelectedIds(new Set());
    await loadFiles();
    setIsProcessing(false);
  };

  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDrop = async (folderId: string) => {
    if (!draggedId || draggedId === folderId) return;
    await mediaDB.update(draggedId, { parentId: folderId });
    setDraggedId(null);
    await loadFiles();
  };

  const currentItems = useMemo(() => {
    return items.filter(item => item.parentId === currentFolderId)
      .sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      });
  }, [items, currentFolderId]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-sm min-h-[80vh]">
      <div className="p-6 border-b flex justify-between items-center bg-gray-50/50 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => fileInputRef.current?.click()} className="bg-[#007BFF] text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all">
            <Upload size={14} /> {isProcessing ? `NAHRÁVÁM ${uploadProgress}%` : 'NAHRÁT Z PC'}
          </button>
          <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleUpload} />
          <button onClick={() => {const n=prompt('Název složky:'); if(n) mediaDB.save({id:'f-'+Math.random().toString(36).substr(2,9), name:n, type:'folder', parentId:currentFolderId})}} className="border-2 border-black px-6 py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <FolderPlus size={14} /> NOVÁ SLOŽKA
          </button>
          {selectedIds.size > 0 && (
            <button onClick={deleteBulk} className="bg-red-600 text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Trash2 size={14} /> SMAZAT VYBRANÉ ({selectedIds.size})
            </button>
          )}
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="HLEDAT..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="pl-12 pr-6 py-3 border text-[10px] font-black w-64 uppercase" />
        </div>
      </div>

      <div className="px-8 py-4 flex items-center gap-3 text-[9px] font-black uppercase text-gray-400 border-b">
        <button onClick={()=>setCurrentFolderId(null)} className={!currentFolderId ? 'text-black' : ''}>KOŘEN</button>
        {items.filter(i => i.id === currentFolderId).map(f => (
          <React.Fragment key={f.id}><ChevronRight size={10}/><button className="text-black">{f.name}</button></React.Fragment>
        ))}
      </div>

      <div className="p-8 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
        {currentItems.map(item => (
          <div 
            key={item.id}
            draggable={item.type !== 'folder'}
            onDragStart={() => handleDragStart(item.id)}
            onDragOver={(e) => { e.preventDefault(); if(item.type==='folder') e.currentTarget.classList.add('bg-blue-50'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('bg-blue-50')}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-blue-50'); handleDrop(item.id); }}
            className={`group relative flex flex-col items-center gap-3 p-4 border-2 transition-all cursor-pointer ${selectedIds.has(item.id) ? 'border-[#007BFF] bg-blue-50/30' : 'border-transparent hover:border-gray-100'}`}
            onClick={() => item.type === 'folder' ? setCurrentFolderId(item.id) : setPreviewItem(item)}
          >
            <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100" onClick={(e)=>{e.stopPropagation(); toggleSelect(item.id);}}>
               {selectedIds.has(item.id) ? <CheckSquare className="text-[#007BFF]" size={16} /> : <Square className="text-gray-300" size={16} />}
            </div>
            <div className="aspect-square w-full flex items-center justify-center overflow-hidden">
               {item.type === 'folder' ? <Folder size={48} className="text-[#007BFF]/20 group-hover:text-[#007BFF]" /> : <img src={item.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0" />}
            </div>
            <p className="text-[9px] font-black uppercase truncate w-full text-center text-gray-400 group-hover:text-black">{item.name}</p>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-[1000] bg-black/95 flex flex-col md:flex-row" onClick={() => setPreviewItem(null)}>
            <button className="absolute left-10 top-1/2 -translate-y-1/2 text-white p-4 hover:bg-white/10" onClick={(e)=>{e.stopPropagation(); navigatePreview(-1);}}><ChevronLeft size={48}/></button>
            <button className="absolute right-[410px] top-1/2 -translate-y-1/2 text-white p-4 hover:bg-white/10 hidden md:block" onClick={(e)=>{e.stopPropagation(); navigatePreview(1);}}><ChevronRight size={48}/></button>
            <div className="flex-grow flex items-center justify-center p-10">
               {previewItem.type === 'video' ? <video src={previewItem.url} controls autoPlay className="max-w-full max-h-full shadow-2xl" /> : <img src={previewItem.url} className="max-w-full max-h-full object-contain shadow-2xl" />}
            </div>
            <div className="w-full md:w-[400px] bg-white h-full p-10 space-y-8 overflow-y-auto" onClick={e=>e.stopPropagation()}>
               <div className="flex justify-between items-center border-b pb-6">
                  <h3 className="text-lg font-black uppercase">Vlastnosti souboru</h3>
                  <button onClick={()=>setPreviewItem(null)}><X size={32}/></button>
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-gray-400">Název / Meta Tagy</label>
                  <input type="text" value={previewItem.name} onChange={e=>{mediaDB.update(previewItem.id, {name:e.target.value}); setPreviewItem({...previewItem, name:e.target.value})}} className="w-full border p-3 font-bold text-sm" />
                  <label className="text-[10px] font-black uppercase text-gray-400">Specializace</label>
                  <select value={previewItem.specializationId || ''} onChange={e=>{mediaDB.update(previewItem.id, {specializationId:e.target.value}); setPreviewItem({...previewItem, specializationId:e.target.value})}} className="w-full border p-3 font-bold text-xs uppercase">
                    <option value="">Žádná</option>
                    {SPECIALIZATIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
               </div>
               <div className="pt-6 border-t text-[10px] font-bold text-gray-400 space-y-2 uppercase">
                  <p>Typ: <span className="text-black">{previewItem.type}</span></p>
                  <p>Velikost: <span className="text-black">{previewItem.size}</span></p>
               </div>
               <button onClick={()=>deleteBulk()} className="w-full bg-red-600 text-white py-4 text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all">Smazat soubor</button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileManager;
