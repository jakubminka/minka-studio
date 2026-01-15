
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Folder, ImageIcon, Video as VideoIcon, Upload, Plus, ChevronRight, 
  Trash2, Grid, List as ListIcon, Search, X, HardDrive, RefreshCw,
  Edit2, FolderPlus, Info, CheckSquare, Square,
  MoreVertical, Download, ExternalLink, Move, FileText, ArrowUpDown,
  FolderTree, CornerUpLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SPECIALIZATIONS } from '../../constants';
import { FileItem } from '../../types';
import { mediaDB } from '../../lib/db';

const FileManager: React.FC = () => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [items, setItems] = useState<FileItem[]>([]);
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  
  // States pro UI interakce
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, itemId: string } | null>(null);
  const [moveModal, setMoveModal] = useState<{ itemId: string } | null>(null);

  const loadFiles = async () => {
    try {
      const dbItems = await mediaDB.getAll();
      
      // Inicializace systémových složek při prvním spuštění
      if (dbItems.length === 0) {
        const systemFolders: FileItem[] = [
          { id: 'f-portfolio', name: 'Portfolio', type: 'folder', updatedAt: new Date().toISOString(), parentId: null },
          { id: 'f-blog', name: 'Blog', type: 'folder', updatedAt: new Date().toISOString(), parentId: null },
          { id: 'f-banners', name: 'Bannery webu', type: 'folder', updatedAt: new Date().toISOString(), parentId: null },
          { id: 'f-misc', name: 'Ostatní', type: 'folder', updatedAt: new Date().toISOString(), parentId: null },
        ];
        for (const f of systemFolders) await mediaDB.save(f);
        setItems(systemFolders);
      } else {
        // Normalizace parentId (indexedDB může vrátit prázdný string místo null)
        setItems(dbItems.map(i => ({...i, parentId: i.parentId || null})));
      }
    } catch (e) {
      console.error("Chyba DB:", e);
    }
  };

  useEffect(() => {
    loadFiles();
    const handleRefresh = () => loadFiles();
    window.addEventListener('storage', handleRefresh);
    const hideContext = () => setContextMenu(null);
    window.addEventListener('click', hideContext);
    return () => {
      window.removeEventListener('storage', handleRefresh);
      window.removeEventListener('click', hideContext);
    };
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageToWebP = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_W = 1920;
        let w = img.width;
        let h = img.height;
        if (w > MAX_W) { h *= MAX_W / w; w = MAX_W; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/webp', 0.8));
      };
    });
  };

  const createFolder = async () => {
    const name = prompt('Název nové složky:');
    if (!name?.trim()) return;
    const newFolder: FileItem = {
      id: 'f-' + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      type: 'folder',
      updatedAt: new Date().toISOString(),
      parentId: currentFolderId
    };
    await mediaDB.save(newFolder);
    await loadFiles();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(file);
      });

      let finalData = result;
      let finalName = file.name;

      if (file.type.startsWith('image')) {
        finalData = await processImageToWebP(result);
        finalName = file.name.split('.')[0] + '.webp';
      }

      const newItem: FileItem = {
        id: 'm-' + Math.random().toString(36).substr(2, 9),
        name: finalName,
        type: file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'other',
        size: `${(finalData.length * 0.75 / (1024 * 1024)).toFixed(2)} MB`,
        updatedAt: new Date().toISOString(),
        url: finalData,
        parentId: currentFolderId,
        mediaType: file.type.startsWith('video') ? 'video' : 'photo'
      };
      
      await mediaDB.save(newItem);
      setUploadProgress(Math.round(((i + 1) / files.length) * 100));
    }
    await loadFiles();
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deleteItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    if (!confirm(`Opravdu smazat ${item.type === 'folder' ? 'SLOŽKU A VŠE UVNITŘ' : 'tento soubor'}?`)) return;
    
    if (item.type === 'folder') {
      const children = items.filter(i => i.parentId === id);
      for (const child of children) await mediaDB.delete(child.id);
    }
    
    await mediaDB.delete(id);
    await loadFiles();
    setPreviewItem(null);
  };

  const renameItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newName = prompt('Nový název:', item.name);
    if (!newName?.trim()) return;
    await mediaDB.save({ ...item, name: newName.trim(), updatedAt: new Date().toISOString() });
    await loadFiles();
  };

  const moveItem = async (itemId: string, targetFolderId: string | null) => {
    if (itemId === targetFolderId) return;
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    await mediaDB.save({ ...item, parentId: targetFolderId, updatedAt: new Date().toISOString() });
    await loadFiles();
    setMoveModal(null);
  };

  const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, itemId });
  };

  const currentItems = useMemo(() => {
    let base = items
      .filter(item => item.parentId === currentFolderId)
      .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return base.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [items, currentFolderId, searchQuery, sortBy]);

  const breadcrumbs = useMemo(() => {
    const trail = [];
    let tid = currentFolderId;
    while (tid) {
      const f = items.find(i => i.id === tid);
      if (f) { trail.unshift(f); tid = f.parentId; } else tid = null;
    }
    return trail;
  }, [items, currentFolderId]);

  return (
    <div className="min-h-[75vh] flex flex-col bg-white border border-gray-200 rounded-sm relative">
      
      {/* Horní ovládací lišta */}
      <div className="p-6 border-b flex flex-wrap gap-4 justify-between items-center bg-gray-50/50 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button 
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#007BFF] text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-xl shadow-blue-500/10"
          >
            {isProcessing ? <RefreshCw className="animate-spin" size={14} /> : <Upload size={14} />}
            {isProcessing ? `NAHRÁVÁM ${uploadProgress}%` : 'NAHRÁT SOUBORY'}
          </button>
          <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleUpload} />
          
          <button onClick={createFolder} className="bg-white border-2 border-black text-black px-6 py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black hover:text-white transition-all">
            <FolderPlus size={14} /> NOVÁ SLOŽKA
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-sm">
             <button onClick={() => setViewMode('grid')} className={`p-2 transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#007BFF]' : 'text-gray-400'}`}><Grid size={16} /></button>
             <button onClick={() => setViewMode('list')} className={`p-2 transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[#007BFF]' : 'text-gray-400'}`}><ListIcon size={16} /></button>
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="bg-white border border-gray-200 px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none">
            <option value="date">NEJNOVĚJŠÍ</option>
            <option value="name">NÁZEV (A-Z)</option>
          </select>
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="HLEDAT..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-12 pr-6 py-3 bg-white border border-gray-200 text-[10px] font-black uppercase tracking-widest focus:outline-none w-64" />
          </div>
        </div>
      </div>

      {/* Drobečková navigace */}
      <div className="px-8 py-4 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 border-b bg-white">
        <button onClick={() => setCurrentFolderId(null)} className={`hover:text-[#007BFF] transition-colors flex items-center gap-2 ${!currentFolderId ? 'text-black font-extrabold' : ''}`}>
           <HardDrive size={12} /> KOŘEN
        </button>
        {breadcrumbs.map(f => (
          <React.Fragment key={f.id}>
            <ChevronRight size={10} className="text-gray-200" />
            <button onClick={() => setCurrentFolderId(f.id)} className={`hover:text-[#007BFF] transition-colors ${currentFolderId === f.id ? 'text-black font-extrabold' : ''}`}>{f.name}</button>
          </React.Fragment>
        ))}
      </div>

      {/* Obsah složky */}
      <div className="p-8 flex-grow bg-white min-h-[500px]">
        {currentItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-40 text-gray-200">
            <FolderTree size={64} strokeWidth={1} />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest">Složka je prázdná</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-8">
            {currentItems.map(item => (
              <motion.div 
                layout key={item.id}
                onContextMenu={(e) => handleContextMenu(e, item.id)}
                onClick={() => item.type === 'folder' ? setCurrentFolderId(item.id) : setPreviewItem(item)}
                className="group cursor-pointer relative flex flex-col items-center gap-4"
              >
                <div className="aspect-square w-full flex items-center justify-center overflow-hidden border-2 border-gray-50 group-hover:border-[#007BFF] group-hover:bg-gray-50 transition-all relative">
                   {item.type === 'folder' ? (
                     <Folder size={64} className="text-[#007BFF]/20 group-hover:text-[#007BFF] transition-colors" />
                   ) : (
                     <img src={item.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                   )}
                   {item.type === 'video' && <div className="absolute top-2 right-2 bg-black/80 text-white p-2 rounded-full"><VideoIcon size={12} /></div>}
                </div>
                <p className="text-[10px] font-black uppercase tracking-tight truncate w-full text-center text-gray-500 group-hover:text-black transition-colors">{item.name}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
             <div className="grid grid-cols-12 gap-4 px-6 py-3 text-[9px] font-black uppercase text-gray-400 border-b">
                <div className="col-span-6">NÁZEV</div>
                <div className="col-span-2">TYP</div>
                <div className="col-span-2">UPRAVENO</div>
                <div className="col-span-2 text-right">AKCE</div>
             </div>
             {currentItems.map(item => (
               <div 
                 key={item.id} 
                 onContextMenu={(e) => handleContextMenu(e, item.id)}
                 onClick={() => item.type === 'folder' ? setCurrentFolderId(item.id) : setPreviewItem(item)}
                 className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 group"
               >
                  <div className="col-span-6 flex items-center gap-4">
                    {item.type === 'folder' ? <Folder size={18} className="text-[#007BFF]" /> : <ImageIcon size={18} className="text-gray-300" />}
                    <span className="truncate text-sm font-bold uppercase tracking-tight">{item.name}</span>
                  </div>
                  <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase">{item.type}</div>
                  <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase">{new Date(item.updatedAt).toLocaleDateString()}</div>
                  <div className="col-span-2 text-right">
                    <button onClick={(e) => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, itemId: item.id }); }} className="p-2 opacity-0 group-hover:opacity-100 transition-all hover:text-[#007BFF]"><MoreVertical size={18} /></button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* Kontextové menu (Pravý klik) */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[100] bg-white border border-gray-100 shadow-2xl py-4 w-64 flex flex-col"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={e => e.stopPropagation()}
          >
             <button onClick={() => renameItem(contextMenu.itemId)} className="px-8 py-3.5 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 text-left flex items-center gap-4 transition-colors"><Edit2 size={16} /> Přejmenovat</button>
             <button onClick={() => setMoveModal({ itemId: contextMenu.itemId })} className="px-8 py-3.5 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 text-left flex items-center gap-4 transition-colors"><Move size={16} /> Přesunout</button>
             <div className="h-px bg-gray-100 my-2"></div>
             <button onClick={() => deleteItem(contextMenu.itemId)} className="px-8 py-3.5 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 text-red-600 text-left flex items-center gap-4 transition-colors"><Trash2 size={16} /> Smazat</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Přesouvací modál */}
      <AnimatePresence>
        {moveModal && (
          <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setMoveModal(null)}>
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg p-12 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-black uppercase tracking-widest">Přesunout do...</h3>
                  <button onClick={() => setMoveModal(null)} className="text-gray-400 hover:text-black"><X size={32} /></button>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                   <button onClick={() => moveItem(moveModal.itemId, null)} className="w-full text-left p-5 hover:bg-[#007BFF] hover:text-white transition-all text-[11px] font-black uppercase flex items-center gap-4 border border-gray-100">
                     <HardDrive size={20} /> KOŘENOVÁ SLOŽKA
                   </button>
                   {items.filter(i => i.type === 'folder' && i.id !== moveModal.itemId).map(f => (
                     <button key={f.id} onClick={() => moveItem(moveModal.itemId, f.id)} className="w-full text-left p-5 hover:bg-[#007BFF] hover:text-white transition-all text-[11px] font-black uppercase flex items-center gap-4 border border-gray-100">
                       <Folder size={20} /> {f.name}
                     </button>
                   ))}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Náhled souboru */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-[1000] bg-black/98 flex flex-col lg:flex-row" onClick={() => setPreviewItem(null)}>
            <div className="flex-grow flex items-center justify-center p-12 lg:p-24">
               {previewItem.type === 'video' ? <video src={previewItem.url} controls className="max-w-full max-h-full shadow-2xl" /> : <img src={previewItem.url} className="max-w-full max-h-full object-contain shadow-2xl" alt="" />}
            </div>
            <div className="w-full lg:w-[500px] bg-white h-full p-12 lg:p-16 flex flex-col gap-12 overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b-4 border-black pb-8">
                  <h3 className="text-3xl font-black uppercase tracking-tighter">Vlastnosti</h3>
                  <button onClick={() => setPreviewItem(null)} className="p-3 hover:bg-gray-100 transition-all"><X size={40} /></button>
                </div>
                <div className="space-y-10">
                   <div className="space-y-3">
                     <label className="text-[11px] font-black uppercase text-gray-400">Název souboru</label>
                     <input type="text" value={previewItem.name} onChange={e => {
                        const upd = {...previewItem, name: e.target.value};
                        mediaDB.save(upd); setItems(prev => prev.map(i => i.id === upd.id ? upd : i)); setPreviewItem(upd);
                     }} className="w-full border-4 border-gray-100 p-5 font-black uppercase focus:border-[#007BFF] outline-none" />
                   </div>
                   <div className="space-y-3">
                     <label className="text-[11px] font-black uppercase text-gray-400">Cesta</label>
                     <div className="p-4 bg-gray-50 border border-gray-100 text-[10px] font-mono break-all">{previewItem.url?.substring(0, 100)}...</div>
                   </div>
                </div>
                <div className="mt-auto bg-gray-50 p-10 border border-gray-100 space-y-4">
                   <div className="flex justify-between text-[11px] font-black uppercase text-gray-400"><span>Velikost</span><span className="text-black">{previewItem.size}</span></div>
                   <div className="flex justify-between text-[11px] font-black uppercase text-gray-400"><span>Typ</span><span className="text-black uppercase">{previewItem.type}</span></div>
                   <button onClick={() => deleteItem(previewItem.id)} className="w-full mt-6 py-6 bg-red-600 text-white text-[12px] font-black uppercase tracking-[0.5em] hover:bg-black transition-all">SMAZAT NAVŽDY</button>
                </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileManager;
