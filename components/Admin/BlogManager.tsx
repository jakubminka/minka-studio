
import React, { useState, useEffect, useRef } from 'react';
import { BlogPost, FileItem } from '../../types';
import { 
  Plus, Trash2, Edit2, X, Search, 
  ImageIcon, User, HardDrive, 
  Bold, Italic, List, FileText, ChevronRight, Folder, Type, ListOrdered, Calendar as CalendarIcon, Target,
  Image as LucideImage, Video as LucideVideo, CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mediaDB, dataStore } from '../../lib/db';

const BlogManager: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Media Picker in Blog state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'cover' | 'content'>('cover');
  const [allItems, setAllItems] = useState<FileItem[]>([]);

  const editorRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '', content: '', excerpt: '', coverImage: '', date: new Date().toISOString().split('T')[0],
    author: 'Jakub Minka', tags: []
  });

  const loadPosts = async () => {
    const saved = await dataStore.collection('blog').getAll();
    setPosts(saved);
    const dbItems = await mediaDB.getAll();
    setAllItems(dbItems);
  };

  useEffect(() => { loadPosts(); }, []);

  const handleEditorCommand = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      setFormData(prev => ({ ...prev, content: editorRef.current!.innerHTML }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b': e.preventDefault(); handleEditorCommand('bold'); break;
        case 'i': e.preventDefault(); handleEditorCommand('italic'); break;
      }
    }
  };

  const openPicker = (mode: 'cover' | 'content') => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  const insertMedia = (item: FileItem) => {
    if (pickerMode === 'cover') {
      setFormData({ ...formData, coverImage: item.url });
    } else {
      if (editorRef.current) {
        editorRef.current.focus();
        const html = item.type === 'video' 
          ? `<div class="my-8 aspect-video w-full"><video src="${item.url}" controls class="w-full h-full object-cover"></video></div><p><br></p>`
          : `<img src="${item.url}" class="w-full my-8 shadow-2xl border" /><p><br></p>`;
        document.execCommand('insertHTML', false, html);
      }
    }
    setShowPicker(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;
    setIsProcessing(true);
    const postData: BlogPost = {
      id: editingId || 'b-' + Math.random().toString(36).substr(2, 9),
      title: formData.title!,
      content: editorRef.current?.innerHTML || '',
      excerpt: formData.excerpt || '',
      coverImage: formData.coverImage || '',
      date: formData.date || new Date().toISOString(),
      author: formData.author || 'Jakub Minka',
      tags: formData.tags || []
    };
    await dataStore.collection('blog').save(postData);
    setIsProcessing(false);
    setShowForm(false);
    loadPosts();
  };

  const inputClass = "w-full border-2 border-gray-100 p-4 font-bold text-black outline-none focus:border-[#007BFF] transition-all bg-white";

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 border flex justify-between items-center shadow-sm">
        <button onClick={()=>{setEditingId(null); setFormData({title:'', date:new Date().toISOString().split('T')[0], author: 'Jakub Minka', tags: [], excerpt: '', coverImage: ''}); setShowForm(true); setTimeout(()=>editorRef.current&&(editorRef.current.innerHTML=''),100)}} className="bg-[#007BFF] text-white px-8 py-3.5 text-[10px] font-black uppercase hover:bg-black transition-all">
          <Plus size={16} className="mr-2 inline"/> NOVÝ ČLÁNEK
        </button>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="HLEDAT..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="pl-12 pr-6 py-3 border text-[10px] font-black w-64 uppercase text-black bg-white" />
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border p-10 relative shadow-2xl text-black">
            <button onClick={()=>setShowForm(false)} className="absolute top-8 right-8 text-black hover:text-[#007BFF]"><X size={32}/></button>
            <form onSubmit={handleSave} className="space-y-10">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-8 space-y-6">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400">Titulek článku</label>
                        <input type="text" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} className={`${inputClass} text-2xl uppercase`} placeholder="Zadejte titulek..." />
                     </div>
                     
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400">Krátký úryvek (Excerpt)</label>
                        <textarea value={formData.excerpt} onChange={e=>setFormData({...formData, excerpt:e.target.value})} className={`${inputClass} h-20 resize-none`} placeholder="Krátké shrnutí pro náhled..." />
                     </div>

                     <div className="border-4 border-gray-50 overflow-hidden rounded-sm bg-white">
                        <div className="bg-gray-100 border-b p-3 flex flex-wrap gap-2 sticky top-0 z-10">
                           <button type="button" onClick={()=>handleEditorCommand('formatBlock', 'h2')} className="px-3 py-1.5 border bg-white font-black text-xs hover:bg-black hover:text-white transition-colors">H2</button>
                           <button type="button" onClick={()=>handleEditorCommand('formatBlock', 'h3')} className="px-3 py-1.5 border bg-white font-black text-xs hover:bg-black hover:text-white transition-colors">H3</button>
                           <div className="w-px h-6 bg-gray-300 mx-2"/>
                           <button type="button" onClick={()=>handleEditorCommand('bold')} className="p-2 border bg-white hover:bg-[#007BFF] hover:text-white transition-all"><Bold size={16}/></button>
                           <button type="button" onClick={()=>handleEditorCommand('italic')} className="p-2 border bg-white hover:bg-[#007BFF] hover:text-white transition-all"><Italic size={16}/></button>
                           <button type="button" onClick={()=>handleEditorCommand('insertUnorderedList')} className="p-2 border bg-white hover:bg-[#007BFF] hover:text-white transition-all"><List size={16}/></button>
                           <div className="w-px h-6 bg-gray-300 mx-2"/>
                           <button type="button" onClick={()=>openPicker('content')} className="flex items-center gap-2 px-4 py-1.5 border-2 border-black bg-white font-black text-[10px] uppercase hover:bg-black hover:text-white transition-all"><LucideImage size={14}/> VLOŽIT MÉDIA</button>
                        </div>
                        <div 
                          ref={editorRef} 
                          contentEditable 
                          onKeyDown={handleKeyDown}
                          className="min-h-[500px] p-8 outline-none prose prose-lg max-w-none text-black bg-white" 
                          dangerouslySetInnerHTML={{__html: formData.content || ''}} 
                        />
                     </div>
                  </div>

                  <div className="lg:col-span-4 space-y-8">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-400 block">Hlavní obrázek (Cover)</label>
                        <div className="aspect-[16/10] bg-gray-50 border-4 border-dashed border-gray-100 flex items-center justify-center relative overflow-hidden group">
                           {formData.coverImage ? (
                              <div className="w-full h-full">
                                 <img src={formData.coverImage} className="w-full h-full object-cover" />
                                 <button type="button" onClick={()=>setFormData({...formData, coverImage:''})} className="absolute top-4 right-4 bg-red-600 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button>
                              </div>
                           ) : (
                              <button type="button" onClick={()=>openPicker('cover')} className="bg-white p-6 border-2 border-gray-100 flex flex-col items-center gap-3 font-black text-[9px] uppercase hover:border-[#007BFF] transition-all"><LucideImage size={24}/> VYBRAT COVER</button>
                           )}
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-400">Datum publikace</label>
                        <input type="date" value={formData.date?.split('T')[0]} onChange={e=>setFormData({...formData, date:e.target.value})} className={inputClass} />
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2"><Target size={14}/> Štítky (Tags)</label>
                        <input type="text" value={formData.tags?.join(', ')} onChange={e=>setFormData({...formData, tags:e.target.value.split(',').map(t=>t.trim())})} className={inputClass} placeholder="architektura, video, backstage..." />
                     </div>

                     <button type="submit" className="w-full bg-[#007BFF] text-white py-6 text-[11px] font-black uppercase tracking-[0.4em] hover:bg-black transition-all shadow-xl">
                        {isProcessing ? 'PUBLIKUJI...' : 'PUBLIKOVAT ČLÁNEK'}
                     </button>
                  </div>
               </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPicker && (
          <div className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center p-12" onClick={()=>setShowPicker(false)}>
            <div className="bg-white w-full max-w-6xl h-[85vh] flex flex-col rounded-sm overflow-hidden" onClick={e=>e.stopPropagation()}>
               <div className="p-8 border-b flex justify-between items-center bg-gray-50 text-black">
                  <h3 className="text-xl font-black uppercase">Vybrat z knihovny</h3>
                  <button onClick={()=>setShowPicker(false)} className="text-black hover:text-red-500 transition-colors"><X size={32}/></button>
               </div>
               <div className="p-10 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-6 overflow-y-auto bg-gray-50/20">
                  {allItems.filter(i => i.type !== 'folder').map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => insertMedia(item)}
                      className="relative aspect-square border-2 border-transparent hover:border-[#007BFF] transition-all p-1 cursor-pointer bg-white group shadow-sm"
                    >
                       <img src={item.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"/>
                       <div className="absolute inset-0 bg-[#007BFF]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Plus className="text-white bg-[#007BFF] rounded-full p-2" size={40}/>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white border border-gray-100 rounded-sm p-6 group hover:border-[#007BFF] transition-all shadow-sm">
            <h3 className="font-black uppercase tracking-tight text-sm mb-4 line-clamp-2 text-black">{post.title}</h3>
            <div className="flex justify-between items-center pt-4 border-t border-gray-50">
              <span className="text-[9px] font-bold text-gray-400 uppercase">{new Date(post.date).toLocaleDateString()}</span>
              <div className="flex gap-2">
                <button onClick={()=>{setEditingId(post.id); setFormData(post); setShowForm(true)}} className="p-2 text-gray-400 hover:text-[#007BFF] transition-colors"><Edit2 size={16}/></button>
                <button onClick={async ()=>{if(confirm('Smazat?')){await dataStore.collection('blog').delete(post.id); loadPosts()}}} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogManager;
