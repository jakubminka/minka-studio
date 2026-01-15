
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BlogPost, FileItem } from '../../types';
import { 
  Plus, Trash2, Edit2, X, Search, 
  ImageIcon, User, HardDrive, 
  Bold, Italic, List, FileText, ChevronRight, Folder
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mediaDB } from '../../lib/db';

const BlogManager: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Media Picker State
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'cover' | 'inline'>('cover');
  const [pickerFolderId, setPickerFolderId] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<FileItem[]>([]);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '', content: '', excerpt: '', coverImage: '', date: new Date().toISOString().split('T')[0],
    author: 'Jakub Minka', tags: []
  });

  const loadPosts = () => {
    const saved = localStorage.getItem('jakub_minka_blog');
    if (saved) setPosts(JSON.parse(saved));
  };

  const loadFiles = async () => {
    const dbItems = await mediaDB.getAll();
    setAllItems(dbItems.map(i => ({...i, parentId: i.parentId || null})));
  };

  useEffect(() => {
    loadPosts();
    loadFiles();
    window.addEventListener('storage', loadPosts);
    return () => window.removeEventListener('storage', loadPosts);
  }, []);

  const saveToStorage = (updated: BlogPost[]) => {
    localStorage.setItem('jakub_minka_blog', JSON.stringify(updated));
    setPosts(updated);
    window.dispatchEvent(new Event('storage'));
  };

  const handleEditorCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) setFormData(prev => ({ ...prev, content: editorRef.current!.innerHTML }));
  };

  const insertImage = (url: string) => {
    const html = `<div style="margin: 40px 0; text-align: center;"><img src="${url}" style="max-width: 100%;" /></div><p><br></p>`;
    document.execCommand('insertHTML', false, html);
    if (editorRef.current) setFormData(prev => ({ ...prev, content: editorRef.current!.innerHTML }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return alert('Chybí název.');
    const htmlContent = editorRef.current?.innerHTML || '';
    if (!htmlContent || htmlContent === '<br>') return alert('Obsah je prázdný.');

    const postData: BlogPost = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      title: formData.title!,
      content: htmlContent,
      excerpt: formData.excerpt || '',
      coverImage: formData.coverImage || '',
      date: formData.date || new Date().toISOString().split('T')[0],
      author: formData.author || 'Jakub Minka',
      tags: formData.tags || []
    };

    saveToStorage(editingId ? posts.map(p => p.id === editingId ? postData : p) : [postData, ...posts]);
    setShowForm(false);
    setEditingId(null);
  };

  const handleFileSelect = (file: FileItem) => {
    if (file.type === 'folder') { setPickerFolderId(file.id); return; }
    if (pickerTarget === 'cover') setFormData(prev => ({ ...prev, coverImage: file.url }));
    else insertImage(file.url!);
    setShowPicker(false);
  };

  // Fixed: useMemo was used but not imported from 'react'
  const pickerBreadcrumbs = useMemo(() => {
    const trail = [];
    let tid = pickerFolderId;
    while (tid) {
      const f = allItems.find(i => i.id === tid);
      if (f) { trail.unshift(f); tid = f.parentId; } else tid = null;
    }
    return trail;
  }, [allItems, pickerFolderId]);

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-white p-6 border flex justify-between items-center shadow-sm">
        <button onClick={() => { setShowForm(true); setEditingId(null); setFormData({title: '', date: new Date().toISOString().split('T')[0]}); if(editorRef.current) editorRef.current.innerHTML = ''; }} className="bg-[#007BFF] text-white px-8 py-3.5 text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"><Plus size={16} className="mr-2 inline" /> Nový článek</button>
        <div className="relative"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Hledat..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-gray-50 border border-gray-100 py-3 pl-12 pr-6 text-xs w-64" /></div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border p-12 relative shadow-2xl">
            <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 text-gray-400 hover:text-black"><X size={32} /></button>
            <form onSubmit={handleSave} className="space-y-10">
               <h2 className="text-2xl font-black uppercase tracking-widest border-b-4 border-black pb-4 flex items-center gap-4"><FileText size={24} className="text-[#007BFF]" /> Editor blogu</h2>
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-8 space-y-8">
                     <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border-4 border-gray-100 p-5 text-2xl font-black focus:border-[#007BFF] outline-none uppercase" placeholder="Titulek článku..." />
                     <div className="border-4 border-gray-100">
                        <div className="bg-gray-50 border-b p-3 flex flex-wrap gap-2">
                           <button type="button" onClick={() => handleEditorCommand('bold')} className="p-2 hover:bg-white border"><Bold size={16} /></button>
                           <button type="button" onClick={() => handleEditorCommand('italic')} className="p-2 hover:bg-white border"><Italic size={16} /></button>
                           <button type="button" onClick={() => handleEditorCommand('insertUnorderedList')} className="p-2 hover:bg-white border"><List size={16} /></button>
                           <button type="button" onClick={() => { setPickerTarget('inline'); loadFiles(); setShowPicker(true); }} className="flex items-center gap-2 px-4 py-2 bg-[#007BFF] text-white text-[9px] font-black uppercase tracking-widest"><ImageIcon size={14} /> Vložit z úložiště</button>
                        </div>
                        <div ref={editorRef} contentEditable className="min-h-[500px] p-10 outline-none prose prose-xl max-w-none text-gray-800" />
                     </div>
                  </div>
                  <div className="lg:col-span-4 space-y-8">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Náhled (Banner)</label>
                        <div className="aspect-video bg-gray-50 border-4 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer" onClick={() => { setPickerTarget('cover'); loadFiles(); setShowPicker(true); }}>
                           {formData.coverImage ? <img src={formData.coverImage} className="w-full h-full object-cover" /> : <ImageIcon size={48} className="text-gray-100" />}
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black uppercase">Vybrat z úložiště</div>
                        </div>
                     </div>
                     <textarea value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} className="w-full border-4 border-gray-100 p-5 h-32 resize-none text-xs font-bold" placeholder="Perex..." />
                     <button type="submit" className="w-full bg-black text-white py-6 text-[12px] font-black uppercase tracking-[0.4em] hover:bg-[#007BFF] transition-all">Publikovat článek</button>
                  </div>
               </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {posts.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).map(post => (
          <div key={post.id} className="bg-white border group hover:border-[#007BFF] transition-all overflow-hidden">
            <img src={post.coverImage} className="aspect-video w-full object-cover grayscale group-hover:grayscale-0" />
            <div className="p-6">
               <h3 className="text-sm font-black uppercase tracking-tight line-clamp-1">{post.title}</h3>
               <div className="flex gap-4 mt-6">
                  <button onClick={() => { setEditingId(post.id); setFormData(post); setShowForm(true); setTimeout(() => { if(editorRef.current) editorRef.current.innerHTML = post.content; }, 100); }} className="text-[9px] font-black uppercase text-[#007BFF]">Upravit</button>
                  <button onClick={() => saveToStorage(posts.filter(p => p.id !== post.id))} className="text-[9px] font-black uppercase text-red-500">Smazat</button>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Picker modál (pro Blog) */}
      <AnimatePresence>
        {showPicker && (
          <div className="fixed inset-0 z-[1100] bg-black/95 flex items-center justify-center p-12" onClick={() => setShowPicker(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl rounded-sm overflow-hidden" onClick={e => e.stopPropagation()}>
               <div className="p-8 border-b flex justify-between items-center bg-gray-50">
                  <h3 className="text-xl font-black uppercase flex items-center gap-4"><HardDrive size={24} className="text-[#007BFF]" /> Vybrat z knihovny</h3>
                  <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-black"><X size={32} /></button>
               </div>
               <div className="px-8 py-4 bg-white border-b flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase">
                  <button onClick={() => setPickerFolderId(null)} className={!pickerFolderId ? 'text-black font-extrabold' : ''}>ROOT</button>
                  {pickerBreadcrumbs.map(f => (
                    <React.Fragment key={f.id}>
                      <ChevronRight size={14} />
                      <button onClick={() => setPickerFolderId(f.id)} className={pickerFolderId === f.id ? 'text-black font-extrabold' : ''}>{f.name}</button>
                    </React.Fragment>
                  ))}
               </div>
               <div className="flex-grow p-10 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 gap-8 bg-gray-50/20 custom-scrollbar">
                  {allItems.filter(i => i.parentId === pickerFolderId).map(item => (
                    <div key={item.id} onClick={() => handleFileSelect(item)} className="bg-white border-2 border-transparent hover:border-[#007BFF] p-3 cursor-pointer group flex flex-col items-center">
                       <div className="w-full aspect-square bg-gray-100 flex items-center justify-center mb-2 overflow-hidden">
                          {item.type === 'folder' ? <Folder size={40} className="text-[#007BFF]/10 group-hover:text-[#007BFF]" /> : <img src={item.url} className="w-full h-full object-cover" />}
                       </div>
                       <p className="text-[9px] font-black uppercase truncate w-full text-center text-gray-400 group-hover:text-black">{item.name}</p>
                    </div>
                  ))}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlogManager;
