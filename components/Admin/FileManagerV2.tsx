import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Folder, ImageIcon, Video as VideoIcon, Upload, Plus, ChevronRight, ChevronLeft,
  Trash2, Grid, List as ListIcon, Search, X, HardDrive, RefreshCw,
  Edit2, FolderPlus, MoreVertical, Move, FolderTree, CheckSquare, Square,
  Tag, Info, Settings, AlertCircle, CheckCircle2, Minus, Maximize2, Ban, Copy,
  Eye, Download, FileText, Calendar, HardDriveIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileItem } from '../../types';
import { mediaDB, optimizeImage } from '../../lib/db';
import { supabase } from '../../src/supabaseClient';

interface UploadStatus {
  id: string;
  fileName: string;
  progress: number;
  status: 'optimizing' | 'uploading' | 'completed' | 'error' | 'canceled';
  error?: string;
}

interface Folder {
  id: string;
  name: string;
  itemCount: number;
}

interface ContextMenu {
  x: number;
  y: number;
  itemId: string;
}

const FileManagerV2: React.FC = () => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<FileItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  
  const previewItems = useMemo(() => {
    return currentItems.filter(item => item.type !== 'folder');
  }, [currentItems]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [uploadQueue, setUploadQueue] = useState<UploadStatus[]>([]);
  const [isQueueMinimized, setIsQueueMinimized] = useState(false);
  const [editingItem, setEditingItem] = useState<FileItem | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showMetadataEditor, setShowMetadataEditor] = useState<FileItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [moveToFolderId, setMoveToFolderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    const dbItems = await mediaDB.getAll();
    setItems(dbItems.map(i => ({...i, parentId: i.parentId || null})));
  };

  useEffect(() => {
    loadFiles();
    window.addEventListener('storage', loadFiles);
    return () => window.removeEventListener('storage', loadFiles);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const quality = parseFloat(localStorage.getItem('jakub_minka_compression_quality') || '0.8');
    const fileList = Array.from(files) as File[];
    
    for (const file of fileList) {
      // Kontrola duplikátů - je soubor s tímto jménem již v systému?
      const fileName = file.name.split('.')[0];
      const existingFile = items.find(i => i.name === fileName && i.type !== 'folder');
      
      if (existingFile) {
        const uploadId = Math.random().toString(36).substr(2, 9);
        setUploadQueue(prev => [...prev, { 
          id: uploadId, 
          fileName: file.name, 
          progress: 0, 
          status: 'error', 
          error: `Soubor "${file.name}" již existuje` 
        }]);
        continue;
      }

      const uploadId = Math.random().toString(36).substr(2, 9);
      const initialStatus: UploadStatus = {
        id: uploadId, fileName: file.name, progress: 0,
        status: file.type.startsWith('image/') ? 'optimizing' : 'uploading'
      };
      
      setUploadQueue(prev => [initialStatus, ...prev]);
      setIsQueueMinimized(false);

      try {
        let fileToUpload: Blob | File = file;
        if (file.type.startsWith('image/')) {
          fileToUpload = await optimizeImage(file, quality / 100);
          setUploadQueue(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'uploading' } : u));
        }

        const fileId = 'm-' + Math.random().toString(36).substr(2, 9);
        const storagePath = `uploads/${fileId}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

        const uploadResp = await supabase.storage
          .from('media')
          .upload(storagePath, fileToUpload, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadResp.error) {
          setUploadQueue(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'error', error: uploadResp.error.message || 'Upload failed' } : u));
          continue;
        }

        const publicResp = supabase.storage
          .from('media')
          .getPublicUrl(storagePath);
        const publicUrl = publicResp.data?.publicUrl || '';

        const newItem: FileItem = {
          id: fileId, 
          name: file.name.split('.')[0],
          type: file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'other',
          size: `${(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB`,
          url: publicUrl, 
          parentId: currentFolderId, 
          specializationId: storagePath,
          created_at: new Date().toISOString()
        };

        await mediaDB.save(newItem);
        setUploadQueue(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'completed', progress: 100 } : u));
        loadFiles();
      } catch (err: any) {
        setUploadQueue(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'error', error: err.message || 'Upload failed' } : u));
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    try {
      // Delete from storage if it's a file
      if (item.type !== 'folder' && item.specializationId) {
        const { error: deleteError } = await supabase.storage
          .from('media')
          .remove([item.specializationId]);
        
        if (deleteError && !deleteError.message.includes('not found')) {
          throw deleteError;
        }
      }

      // Delete from database
      await mediaDB.delete(id);
      setDeleteConfirm(null);
      loadFiles();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Chyba při mazání: ' + (err instanceof Error ? err.message : 'Neznámá chyba'));
    }
  };

  const handleRename = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    
    const item = items.find(i => i.id === id);
    if (!item) return;

    try {
      await mediaDB.update(id, { name: newName });
      setEditingItem(null);
      setEditName('');
      loadFiles();
    } catch (err) {
      console.error('Rename error:', err);
      alert('Chyba při přejmenování');
    }
  };

  const handleMoveToFolder = async (itemId: string, targetFolderId: string | null) => {
    try {
      await mediaDB.update(itemId, { parentId: targetFolderId });
      setMoveToFolderId(null);
      loadFiles();
    } catch (err) {
      console.error('Move error:', err);
      alert('Chyba při přesunutí');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      itemId
    });
  };

  const handleCreateFolder = async () => {
    const folderName = prompt('Název nové složky:');
    if (!folderName?.trim()) return;

    try {
      const folderId = 'f-' + Math.random().toString(36).substr(2, 9);
      const folderItem: FileItem = {
        id: folderId,
        name: folderName,
        type: 'folder',
        parentId: currentFolderId,
        size: '—',
        url: '',
        created_at: new Date().toISOString(),
        specializationId: ''
      };
      
      await mediaDB.save(folderItem);
      loadFiles();
    } catch (err) {
      console.error('Create folder error:', err);
      alert('Chyba při vytváření složky');
    }
  };

  const currentItems = useMemo(() => {
    return items.filter(item => 
      item.parentId === currentFolderId && 
      (searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [items, currentFolderId, searchQuery]);

  const folderPath = useMemo(() => {
    let current = currentFolderId;
    const path: Folder[] = [];
    
    while (current) {
      const folder = items.find(i => i.id === current && i.type === 'folder');
      if (!folder) break;
      path.unshift({ id: folder.id, name: folder.name, itemCount: items.filter(i => i.parentId === current && i.type !== 'folder').length });
      current = folder.parentId || null;
    }
    
    return path;
  }, [items, currentFolderId]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'folder': return <Folder size={32} className="text-[#007BFF]" />;
      case 'image': return <ImageIcon size={32} className="text-purple-500" />;
      case 'video': return <VideoIcon size={32} className="text-red-500" />;
      default: return <FileText size={32} className="text-gray-500" />;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('cs-CZ', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-sm min-h-[80vh]">
      {/* Header */}
      <div className="p-6 border-b bg-gray-50 sticky top-0 z-40">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-black uppercase tracking-widest text-black">Správce médií</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 hover:bg-gray-200 rounded"
              title={`Přepnout na ${viewMode === 'grid' ? 'seznam' : 'mřížku'}`}
            >
              {viewMode === 'grid' ? <ListIcon size={18} /> : <Grid size={18} />}
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-500 mb-4">
          <button 
            onClick={() => setCurrentFolderId(null)}
            className={`hover:text-[#007BFF] transition-colors ${!currentFolderId ? 'text-[#007BFF]' : ''}`}
          >
            Kořen
          </button>
          {folderPath.map(folder => (
            <div key={folder.id} className="flex items-center gap-2">
              <ChevronRight size={14} className="text-gray-300" />
              <button 
                onClick={() => setCurrentFolderId(folder.id)}
                className="hover:text-[#007BFF] transition-colors"
              >
                {folder.name}
              </button>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-3 flex-wrap">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="bg-[#007BFF] text-white px-6 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all rounded"
          >
            <Upload size={14} /> Nahrát
          </button>
          <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleUpload} />
          
          <button 
            onClick={handleCreateFolder}
            className="border-2 border-[#007BFF] bg-white text-[#007BFF] px-6 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 rounded hover:bg-blue-50 transition-all"
          >
            <FolderPlus size={14} /> Nová složka
          </button>

          <div className="relative flex-1 min-w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="HLEDAT..." 
              value={searchQuery} 
              onChange={e=>setSearchQuery(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 bg-white text-black text-[10px] font-black uppercase rounded focus:border-[#007BFF] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Content Grid/List */}
      {viewMode === 'grid' ? (
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 flex-1 overflow-auto bg-white">
          {currentItems.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-400">
              <HardDrive size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-[11px] font-black uppercase tracking-widest">Složka je prázdná</p>
            </div>
          ) : (
            currentItems.map(item => (
              <motion.div 
                key={item.id}
                layout
                className="relative group"
              >
                <div 
                  className="relative flex flex-col items-center gap-3 p-3 border-2 border-gray-100 rounded hover:border-[#007BFF] transition-all cursor-pointer bg-gray-50 hover:bg-white h-full"
                  onClick={() => item.type === 'folder' ? setCurrentFolderId(item.id) : setPreviewIndex(previewItems.findIndex(pi => pi.id === item.id))}
                  onContextMenu={(e) => handleContextMenu(e, item.id)}
                >
                  {/* Type specific display */}
                  <div className="w-full aspect-square flex items-center justify-center overflow-hidden rounded bg-white">
                    {item.type === 'folder' ? (
                      <Folder size={48} className="text-[#007BFF]/40" />
                    ) : item.type === 'image' && item.url ? (
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                    ) : (
                      getFileIcon(item.type)
                    )}
                  </div>
                  
                  <p className="text-[9px] font-black uppercase truncate w-full text-center text-gray-600 group-hover:text-[#007BFF]">{item.name}</p>
                  
                  {item.type !== 'folder' && <p className="text-[8px] text-gray-400">{item.size}</p>}

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-all rounded flex items-center justify-center gap-2">
                    {item.type !== 'folder' && (
                      <>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const idx = previewItems.findIndex(pi => pi.id === item.id);
                            if (idx >= 0) setPreviewIndex(idx);
                          }}
                          className="p-2 bg-white/20 hover:bg-white/40 rounded text-white backdrop-blur"
                          title="Náhled"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowMetadataEditor(item); }}
                          className="p-2 bg-white/20 hover:bg-white/40 rounded text-white backdrop-blur"
                          title="Metadata"
                        >
                          <Tag size={16} />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingItem(item); setEditName(item.name); }}
                      className="p-2 bg-white/20 hover:bg-white/40 rounded text-white backdrop-blur"
                      title="Přejmenovat"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item.id); }}
                      className="p-2 bg-red-500/40 hover:bg-red-500/60 rounded text-white backdrop-blur"
                      title="Smazat"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        /* List View */
        <div className="flex-1 overflow-auto">
          <table className="w-full text-[11px] font-black uppercase tracking-widest">
            <thead className="sticky top-0 bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">Název</th>
                <th className="px-6 py-3 text-left">Typ</th>
                <th className="px-6 py-3 text-left">Velikost</th>
                <th className="px-6 py-3 text-left">Datum</th>
                <th className="px-6 py-3 text-center">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-all">
                  <td className="px-6 py-3 flex items-center gap-3">
                    {getFileIcon(item.type)}
                    <span className="truncate">{item.name}</span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">
                    {item.type === 'folder' ? '📁 Složka' : item.type === 'image' ? '🖼️ Foto' : item.type === 'video' ? '🎬 Video' : '📄 Soubor'}
                  </td>
                  <td className="px-6 py-3 text-gray-500">{item.size || '—'}</td>
                  <td className="px-6 py-3 text-gray-500">{formatDate(item.created_at)}</td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      {item.type !== 'folder' && (
                        <>
                          <button 
                            onClick={() => setPreviewIndex(previewItems.findIndex(pi => pi.id === item.id))}
                            className="p-1 hover:text-[#007BFF]"
                            title="Náhled"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            onClick={() => setShowMetadataEditor(item)}
                            className="p-1 hover:text-[#007BFF]"
                            title="Metadata"
                          >
                            <Tag size={14} />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => { setEditingItem(item); setEditName(item.name); }}
                        className="p-1 hover:text-[#007BFF]"
                        title="Přejmenovat"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm(item.id)}
                        className="p-1 hover:text-red-500"
                        title="Smazat"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Enhanced File Preview Modal with Navigation */}
      <AnimatePresence>
        {previewIndex !== null && previewItems[previewIndex] && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setPreviewIndex(null)}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-black rounded flex flex-col h-full max-h-[95vh] w-full max-w-7xl"
            >
              {/* Header */}
              <div className="border-b border-gray-700 p-4 flex justify-between items-center bg-gray-900">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                    {previewIndex + 1} z {previewItems.length}
                  </p>
                  <h3 className="text-lg font-black uppercase tracking-widest text-white max-w-sm truncate">{previewItems[previewIndex]?.name}</h3>
                </div>
                <button onClick={() => setPreviewIndex(null)} className="p-2 hover:bg-gray-800 rounded text-white">
                  <X size={24} />
                </button>
              </div>

              {/* Main Preview Area */}
              <div className="flex-1 overflow-hidden flex">
                {/* Left Navigation */}
                <button 
                  onClick={() => setPreviewIndex(previewIndex > 0 ? previewIndex - 1 : previewItems.length - 1)}
                  className="p-4 hover:bg-gray-800/50 transition-all text-white flex items-center justify-center"
                  title="Předchozí"
                >
                  <ChevronLeft size={32} />
                </button>

                {/* Media Display */}
                <div className="flex-1 flex items-center justify-center overflow-hidden bg-black">
                  {previewItems[previewIndex]?.type === 'image' && previewItems[previewIndex]?.url && (
                    <img 
                      src={previewItems[previewIndex].url} 
                      alt={previewItems[previewIndex].name} 
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                  {previewItems[previewIndex]?.type === 'video' && previewItems[previewIndex]?.url && (
                    <video 
                      src={previewItems[previewIndex].url} 
                      controls 
                      className="max-w-full max-h-full object-contain"
                      autoPlay
                    />
                  )}
                </div>

                {/* Right Navigation */}
                <button 
                  onClick={() => setPreviewIndex(previewIndex < previewItems.length - 1 ? previewIndex + 1 : 0)}
                  className="p-4 hover:bg-gray-800/50 transition-all text-white flex items-center justify-center"
                  title="Další"
                >
                  <ChevronRight size={32} />
                </button>
              </div>

              {/* Metadata Footer */}
              <div className="border-t border-gray-700 bg-gray-900 p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Typ</p>
                  <p className="text-white">{previewItems[previewIndex]?.type.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Velikost</p>
                  <p className="text-white">{previewItems[previewIndex]?.size || '—'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Vytvořeno</p>
                  <p className="text-white text-sm">{formatDate(previewItems[previewIndex]?.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setShowMetadataEditor(previewItems[previewIndex]);
                      setPreviewIndex(null);
                    }}
                    className="flex-1 px-3 py-2 bg-[#007BFF] text-white rounded text-[9px] font-black uppercase hover:bg-blue-700 transition-all"
                  >
                    Metadata
                  </button>
                  <button 
                    onClick={() => {
                      setDeleteConfirm(previewItems[previewIndex]?.id || null);
                      setPreviewIndex(null);
                    }}
                    className="px-3 py-2 bg-red-600 text-white rounded text-[9px] font-black uppercase hover:bg-red-700 transition-all"
                  >
                    Smazat
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metadata Editor Modal */}
      <AnimatePresence>
        {showMetadataEditor && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setShowMetadataEditor(null)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded p-8 max-w-lg w-full space-y-6 my-8"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-widest mb-2">Metadata</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">{showMetadataEditor.name}</p>
                </div>
                <button onClick={() => setShowMetadataEditor(null)} className="p-1 hover:bg-gray-100 rounded">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5 text-[11px] font-black uppercase tracking-widest">
                {/* Thumbnail Preview */}
                <div className="flex items-center justify-center w-full h-40 bg-gray-50 rounded border border-gray-200">
                  {showMetadataEditor.type === 'image' && showMetadataEditor.url && (
                    <img src={showMetadataEditor.url} alt="" className="max-w-full max-h-full object-contain" />
                  )}
                  {showMetadataEditor.type === 'video' && (
                    <VideoIcon size={48} className="text-gray-300" />
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className="block text-gray-600 mb-2">Název</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded focus:border-[#007BFF] outline-none text-[10px]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-gray-600 mb-2">Popis</label>
                  <textarea 
                    placeholder="Přidej popis souboru..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded focus:border-[#007BFF] outline-none text-[10px] resize-none"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-gray-600 mb-2">Štítky</label>
                  <input 
                    type="text" 
                    placeholder="Odděluj čárkami: tag1, tag2, tag3"
                    className="w-full px-4 py-2 border border-gray-200 rounded focus:border-[#007BFF] outline-none text-[10px]"
                  />
                </div>

                {/* File Info */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                  <div>
                    <p className="text-gray-500 mb-1">Typ</p>
                    <p className="text-gray-800">{showMetadataEditor.type.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Velikost</p>
                    <p className="text-gray-800">{showMetadataEditor.size || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Vytvořeno</p>
                    <p className="text-gray-800">{formatDate(showMetadataEditor.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">ID</p>
                    <p className="text-gray-800 text-[9px] font-mono break-all">{showMetadataEditor.id}</p>
                  </div>
                </div>

                {/* URL */}
                <div>
                  <label className="block text-gray-600 mb-2">URL</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={showMetadataEditor.url}
                      readOnly
                      className="flex-1 px-4 py-2 border border-gray-200 rounded bg-gray-50 text-[9px] font-mono"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(showMetadataEditor.url);
                        alert('URL zkopírován');
                      }}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-[9px]"
                    >
                      Kopírovat
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => {
                      handleRename(showMetadataEditor.id, editName);
                      setShowMetadataEditor(null);
                    }}
                    className="flex-1 bg-[#007BFF] text-white px-4 py-3 rounded hover:bg-blue-700 transition-all text-[10px] font-black"
                  >
                    Uložit metadata
                  </button>
                  <button 
                    onClick={() => setShowMetadataEditor(null)}
                    className="px-4 py-3 border border-gray-200 rounded hover:bg-gray-50 transition-all text-[10px] font-black"
                  >
                    Zrušit
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setDeleteConfirm(null)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded p-6 max-w-sm w-full space-y-4"
            >
              <div className="flex items-start gap-4">
                <AlertCircle size={24} className="text-red-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest mb-2">Smazat?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Opravdu chceš smazat: <strong>{items.find(i => i.id === deleteConfirm)?.name}</strong>?
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded hover:bg-gray-50 transition-all text-[10px] font-black uppercase"
                >
                  Zrušit
                </button>
                <button 
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-all text-[10px] font-black uppercase"
                >
                  Smazat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rename Modal */}
      <AnimatePresence>
        {editingItem && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setEditingItem(null)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded p-6 max-w-sm w-full space-y-4"
            >
              <h3 className="text-lg font-black uppercase tracking-widest">Přejmenovat</h3>
              
              <input 
                type="text" 
                value={editName}
                onChange={e => setEditName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(editingItem.id, editName);
                  if (e.key === 'Escape') setEditingItem(null);
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded focus:border-[#007BFF] outline-none text-[11px] font-black uppercase"
              />

              <div className="flex gap-3">
                <button 
                  onClick={() => setEditingItem(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded hover:bg-gray-50 transition-all text-[10px] font-black uppercase"
                >
                  Zrušit
                </button>
                <button 
                  onClick={() => handleRename(editingItem.id, editName)}
                  className="flex-1 px-4 py-2 bg-[#007BFF] text-white rounded hover:bg-blue-700 transition-all text-[10px] font-black uppercase"
                >
                  Uložit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Queue */}
      <AnimatePresence>
        {uploadQueue.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }}
            className={`fixed bottom-8 right-8 z-[100] w-96 bg-white shadow-2xl border border-gray-200 rounded overflow-hidden ${isQueueMinimized ? 'h-14' : 'max-h-[500px]'}`}
          >
            <div 
              className="bg-black text-white p-4 flex justify-between items-center cursor-pointer hover:bg-gray-900 transition-all" 
              onClick={() => setIsQueueMinimized(!isQueueMinimized)}
            >
              <div className="flex items-center gap-3">
                <RefreshCw size={14} className={`${uploadQueue.some(u => u.status === 'uploading') ? 'animate-spin text-[#007BFF]' : 'text-green-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">Nahrávání ({uploadQueue.length})</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setUploadQueue([]); }} 
                className="p-1 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            {!isQueueMinimized && (
              <div className="overflow-y-auto max-h-[400px] p-4 space-y-3 bg-white">
                {uploadQueue.map(upload => (
                  <div key={upload.id} className="space-y-2 border-b border-gray-50 pb-2">
                    <div className="flex justify-between items-start">
                      <p className="text-[9px] font-black uppercase truncate text-black pr-4">{upload.fileName}</p>
                      <span className={`text-[8px] font-black uppercase ${
                        upload.status === 'completed' ? 'text-green-500' : 
                        upload.status === 'error' ? 'text-red-500' : 
                        'text-[#007BFF]'
                      }`}>
                        {upload.status}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div className={`h-full ${
                        upload.status === 'completed' ? 'bg-green-500' :
                        upload.status === 'error' ? 'bg-red-500' :
                        'bg-[#007BFF]'
                      }`} animate={{ width: `${upload.progress}%` }} />
                    </div>
                    {upload.error && <p className="text-[8px] font-bold text-red-500">{upload.error}</p>}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Context Menu */}
      {contextMenu && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 9999
          }}
          className="bg-white border border-gray-200 rounded shadow-xl overflow-hidden w-48"
          onClick={e => e.stopPropagation()}
          onContextMenu={e => e.preventDefault()}
        >
          <div className="py-1">
            {/* Rename */}
            <button
              onClick={() => {
                const item = items.find(i => i.id === contextMenu.itemId);
                if (item) {
                  setEditingItem(item);
                  setEditName(item.name);
                }
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 text-[10px] font-black uppercase hover:bg-blue-50 flex items-center gap-2 transition-colors"
            >
              <Edit2 size={14} /> Přejmenovat
            </button>

            {/* Move to Folder */}
            {items.find(i => i.id === contextMenu.itemId)?.type !== 'folder' && (
              <button
                onClick={() => {
                  setMoveToFolderId(contextMenu.itemId);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-[10px] font-black uppercase hover:bg-blue-50 flex items-center gap-2 transition-colors"
              >
                <Move size={14} /> Přesunout do složky
              </button>
            )}

            {/* Metadata */}
            {items.find(i => i.id === contextMenu.itemId)?.type !== 'folder' && (
              <button
                onClick={() => {
                  const item = items.find(i => i.id === contextMenu.itemId);
                  if (item) {
                    setShowMetadataEditor(item);
                    setEditName(item.name);
                  }
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-[10px] font-black uppercase hover:bg-blue-50 flex items-center gap-2 transition-colors"
              >
                <Tag size={14} /> Metadata
              </button>
            )}

            {/* Divider */}
            <div className="h-px bg-gray-200 my-1"></div>

            {/* Delete */}
            <button
              onClick={() => {
                setDeleteConfirm(contextMenu.itemId);
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 text-[10px] font-black uppercase text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
            >
              <Trash2 size={14} /> Smazat
            </button>
          </div>
        </motion.div>
      )}

      {/* Move to Folder Modal */}
      <AnimatePresence>
        {moveToFolderId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMoveToFolderId(null)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-lg p-6 max-w-md w-full space-y-4"
            >
              <h3 className="text-lg font-black uppercase tracking-widest">Přesunout do složky</h3>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {/* Root */}
                <button
                  onClick={() => {
                    handleMoveToFolder(moveToFolderId, null);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-blue-50 rounded text-[10px] font-black uppercase flex items-center gap-2"
                >
                  <FolderPlus size={14} /> Kořen
                </button>

                {/* Folders */}
                {items.filter(i => i.type === 'folder').map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      handleMoveToFolder(moveToFolderId, folder.id);
                    }}
                    className="w-full text-left px-4 py-2 pl-8 hover:bg-blue-50 rounded text-[10px] font-black uppercase"
                  >
                    {folder.name}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setMoveToFolderId(null)}
                className="w-full px-4 py-2 border border-gray-200 rounded hover:bg-gray-50 text-[10px] font-black uppercase"
              >
                Zrušit
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Context Menu Closer */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setContextMenu(null)}
          onContextMenu={e => e.preventDefault()}
        />
      )}
    </div>
  );
};

export default FileManagerV2;
