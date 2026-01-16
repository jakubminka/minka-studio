
import React, { useState, useEffect, useRef } from 'react';
import { BlogPost, FileItem } from '../../types';
import { 
  Plus, Trash2, Edit2, X, Search, 
  ImageIcon, User, HardDrive, 
  Bold, Italic, List, FileText, ChevronRight, Folder, Type, ListOrdered, Calendar as CalendarIcon, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mediaDB, dataStore } from '../../lib/db';

const BlogManager: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '', content: '', excerpt: '', coverImage: '', date: new Date().toISOString().split('T')[0],
    author: 'Jakub Minka', tags: []
  });

  const loadPosts = async () => {
    const saved = await dataStore.collection('blog').getAll();
    setPosts(saved);
  };

  useEffect(() => { loadPosts(); }, []);

  const handleEditorCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) setFormData(prev => ({ ...prev, content: editorRef.current!.innerHTML }));
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

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 border flex justify-between items-center shadow-sm">
        <button onClick={()=>{setEditingId(null); setFormData({title:'', date:new Date().toISOString().split('T')[0]}); setShowForm(true); setTimeout(()=>editorRef.current&&(editorRef.current.innerHTML=''),100)}} className="bg-[#007BFF] text-white px-8 py-3.5 text-[10px] font-black uppercase hover:bg-black transition-all">
          <Plus size={16} className="mr-2 inline"/> NOVÝ ČLÁNEK
        </button>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="HLEDAT..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="pl-12 pr-6 py-3 border text-[10px] font-black w-64 uppercase" />
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border p-10 relative shadow-2xl">
            <button onClick={()=>setShowForm(false)} className="absolute top-8 right-8 text-gray-400 hover:text-black"><X size={32}/></button>
            <form onSubmit={handleSave} className="space-y-10">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-8 space-y-6">
                     <input type="text" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} className="w-full border-4 border-gray-50 p-4 text-2xl font-black focus:border-[#007BFF] outline-none uppercase" placeholder="Titulek..." />
                     <div className="border-4 border-gray-50">
                        <div className="bg-gray-50 border-b p-3 flex flex-wrap gap-2">
                           <button type="button" onClick={()=>handleEditorCommand('formatBlock', 'H1')} className="p-2 border bg-white font-black">H1</button>
                           <button type="button" onClick={()=>handleEditorCommand('formatBlock', 'H2')} className="p-2 border bg-white font-black">H2</button>
                           <button type="button" onClick={()=>handleEditorCommand('formatBlock', 'H3')} className="p-2 border bg-white font-black">H3</button>
                           <div className="w-px h-6 bg-gray-200 mx-2"/>
                           <button type="button" onClick={()=>handleEditorCommand('bold')} className="p-2 border bg-white"><Bold size={16}/></button>
                           <button type="button" onClick={()=>handleEditorCommand('italic')} className="p-2 border bg-white"><Italic size={16}/></button>
                           <button type="button" onClick={()=>handleEditorCommand('insertUnorderedList')} className="p-2 border bg-white"><List size={16}/></button>
                           <button type="button" onClick={()=>handleEditorCommand('insertOrderedList')} className="p-2 border bg-white"><ListOrdered size={16}/></button>
                        </div>
                        <div ref={editorRef} contentEditable className="min-h-[400px] p-8 outline-none prose prose-xl max-w-none text-gray-800 bg-white" 
                             dangerouslySetInnerHTML={{__html: formData.content || ''}} />
                     </div>
                  </div>
                  <div className="lg:col-span-4 space-y-8">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-400">Datum publikace</label>
                        <input type="date" value={formData.date?.split('T')[0]} onChange={e=>setFormData({...formData, date:e.target.value})} className="w-full border p-4 font-bold" />
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2"><Target size={14}/> SEO Klíčová slova</label>
                        <input type="text" value={formData.tags?.join(', ')} onChange={e=>setFormData({...formData, tags:e.target.value.split(',').map(t=>t.trim())})} className="w-full border p-4 font-bold" placeholder="foto, video, architektura..." />
                     </div>
                     <button type="submit" className="w-full bg-black text-white py-6 text-[11px] font-black uppercase tracking-[0.4em] hover:bg-[#007BFF] transition-all shadow-xl">
                        {isProcessing ? 'PUBLIKUJI...' : 'PUBLIKOVAT ČLÁNEK'}
                     </button>
                  </div>
               </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white border rounded-sm p-6 group hover:border-[#007BFF] transition-all">
            <h3 className="font-black uppercase tracking-tight text-sm mb-4 line-clamp-2">{post.title}</h3>
            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-[9px] font-bold text-gray-400 uppercase">{new Date(post.date).toLocaleDateString()}</span>
              <div className="flex gap-2">
                <button onClick={()=>{setEditingId(post.id); setFormData(post); setShowForm(true)}} className="p-2 text-gray-400 hover:text-[#007BFF]"><Edit2 size={16}/></button>
                <button onClick={async ()=>{if(confirm('Smazat?')){await dataStore.collection('blog').delete(post.id); loadPosts()}}} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogManager;
