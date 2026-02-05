import React, { useState, useEffect } from 'react';
import { BlogPost, FileItem } from '../../types';
import { 
  Plus, Trash2, Edit2, X, Search, 
  Bold, Italic, List, Heading2, Heading3,
  Image as LucideImage, Video as LucideVideo, Link as LinkIcon, 
  Check, RefreshCw, Eye, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { projectDB, mediaDB } from '../../lib/db';
import { supabase } from '../../src/supabaseClient';

const BlogManagerV2: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [allItems, setAllItems] = useState<FileItem[]>([]);

  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    excerpt: '',
    content: '',
    coverImage: '',
    date: new Date().toISOString().split('T')[0],
    author: 'Jakub Minka',
    tags: []
  });

  const [contentHTML, setContentHTML] = useState('');

  const loadData = async () => {
    try {
      const saved = await supabase.from('blog').select('*').order('date', { ascending: false });
      if (saved.data) setPosts(saved.data.map(p => ({
        ...p,
        date: new Date(p.date).toISOString(),
        tags: p.tags || []
      })));
      
      const dbItems = await mediaDB.getAll();
      setAllItems(dbItems.filter(i => i.type !== 'folder'));
    } catch (err) {
      console.error('Load error:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (editingId) {
      const post = posts.find(p => p.id === editingId);
      if (post) {
        setFormData({
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage,
          date: new Date(post.date).toISOString().split('T')[0],
          author: post.author,
          tags: post.tags
        });
        setContentHTML(post.content);
      }
    }
  }, [editingId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !contentHTML.trim()) {
      alert('Vyplň název a obsah článku');
      return;
    }

    setIsProcessing(true);
    try {
      const postData: BlogPost = {
        id: editingId || 'b-' + Math.random().toString(36).substr(2, 9),
        title: formData.title,
        excerpt: formData.excerpt || '',
        content: contentHTML,
        coverImage: formData.coverImage || '',
        date: new Date(formData.date || new Date()).toISOString(),
        author: formData.author || 'Jakub Minka',
        tags: formData.tags || []
      };

      console.log('Saving blog post:', postData);
      const { error, data } = await supabase.from('blog').upsert([postData], { onConflict: 'id' });
      
      console.log('Upsert response:', { error, data });
      if (error) throw error;

      await loadData();
      setShowForm(false);
      setEditingId(null);
      setFormData({
        title: '',
        excerpt: '',
        content: '',
        coverImage: '',
        date: new Date().toISOString().split('T')[0],
        author: 'Jakub Minka',
        tags: []
      });
      setContentHTML('');
    } catch (err) {
      console.error('Full error:', err);
      const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
      alert('Chyba při uložení: ' + errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.getElementById('editor-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = contentHTML.substring(start, end) || 'text';
    
    const newContent = 
      contentHTML.substring(0, start) +
      before + selectedText + after +
      contentHTML.substring(end);

    setContentHTML(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const insertImage = (item: FileItem) => {
    const markdown = `![${item.name}](${item.url})\n`;
    setContentHTML(contentHTML + markdown);
    setShowMediaPicker(false);
  };

  const insertVideo = (item: FileItem) => {
    const markdown = `<video src="${item.url}" controls style="width: 100%; margin: 1rem 0;" />\n`;
    setContentHTML(contentHTML + markdown);
    setShowMediaPicker(false);
  };

  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 border flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({
              title: '',
              excerpt: '',
              content: '',
              coverImage: '',
              date: new Date().toISOString().split('T')[0],
              author: 'Jakub Minka',
              tags: []
            });
            setContentHTML('');
            setShowForm(true);
          }}
          className="bg-[#007BFF] text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
        >
          <Plus size={16} /> Nový článek
        </button>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="HLEDAT..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="pl-12 pr-6 py-3 border text-[10px] font-black w-64 uppercase text-black bg-white focus:border-[#007BFF] outline-none rounded"
          />
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map(post => (
          <motion.div
            key={post.id}
            layout
            className="bg-white border border-gray-200 rounded overflow-hidden hover:border-[#007BFF] transition-all group"
          >
            {/* Cover Image */}
            {post.coverImage && (
              <div className="w-full h-40 overflow-hidden bg-gray-100">
                <img src={post.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
            )}

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2">{new Date(post.date).toLocaleDateString('cs-CZ')}</p>
                <h3 className="text-lg font-black uppercase tracking-tight line-clamp-2">{post.title}</h3>
              </div>
              
              {post.excerpt && (
                <p className="text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <span key={tag} className="text-[8px] bg-gray-100 px-2 py-1 rounded uppercase font-bold">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setEditingId(post.id) || setShowForm(true)}
                  className="flex-1 p-2 text-[10px] font-black uppercase border border-[#007BFF] text-[#007BFF] hover:bg-[#007BFF] hover:text-white transition-all rounded flex items-center justify-center gap-2"
                >
                  <Edit2 size={14} /> Upravit
                </button>
                <button
                  onClick={() => {
                    if (confirm('Smazat artikel?')) {
                      supabase.from('blog').delete().eq('id', post.id).then(() => loadData());
                    }
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 transition-all rounded"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredPosts.length === 0 && !showForm && (
        <div className="py-20 text-center text-gray-400">
          <p className="text-[12px] font-black uppercase tracking-widest">Žádné články</p>
        </div>
      )}

      {/* Editor Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xl"
          >
            <div className="bg-gray-50 border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase tracking-widest">
                {editingId ? 'Upravit' : 'Nový'} článek
              </h2>
              <button 
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-200 rounded"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-600 tracking-widest mb-2">
                      Název článku
                    </label>
                    <input 
                      type="text"
                      value={formData.title || ''}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      placeholder="Zadej název..."
                      className="w-full px-4 py-3 border border-gray-200 rounded text-lg font-black uppercase focus:border-[#007BFF] outline-none"
                    />
                  </div>

                  {/* Excerpt */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-600 tracking-widest mb-2">
                      Krátké shrnutí
                    </label>
                    <textarea 
                      value={formData.excerpt || ''}
                      onChange={e => setFormData({...formData, excerpt: e.target.value})}
                      placeholder="Úryvek pro náhled v seznamu..."
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-200 rounded resize-none focus:border-[#007BFF] outline-none"
                    />
                  </div>

                  {/* Editor Toolbar */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-600 tracking-widest mb-2">
                      Obsah
                    </label>
                    <div className="border border-gray-200 rounded-t bg-gray-50 p-3 flex flex-wrap gap-2 border-b-0">
                      <button 
                        type="button"
                        onClick={() => insertMarkdown('**', '**')}
                        title="Tučný text"
                        className="p-2 border border-gray-300 bg-white hover:bg-[#007BFF] hover:text-white rounded transition-all"
                      >
                        <Bold size={16} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => insertMarkdown('*', '*')}
                        title="Kurzíva"
                        className="p-2 border border-gray-300 bg-white hover:bg-[#007BFF] hover:text-white rounded transition-all"
                      >
                        <Italic size={16} />
                      </button>
                      <div className="w-px bg-gray-300"></div>
                      <button 
                        type="button"
                        onClick={() => insertMarkdown('## ', '\n')}
                        title="Nadpis 2"
                        className="px-3 border border-gray-300 bg-white hover:bg-[#007BFF] hover:text-white rounded transition-all font-black text-sm"
                      >
                        H2
                      </button>
                      <button 
                        type="button"
                        onClick={() => insertMarkdown('### ', '\n')}
                        title="Nadpis 3"
                        className="px-3 border border-gray-300 bg-white hover:bg-[#007BFF] hover:text-white rounded transition-all font-black text-sm"
                      >
                        H3
                      </button>
                      <div className="w-px bg-gray-300"></div>
                      <button 
                        type="button"
                        onClick={() => insertMarkdown('- ')}
                        title="Odrážka"
                        className="p-2 border border-gray-300 bg-white hover:bg-[#007BFF] hover:text-white rounded transition-all"
                      >
                        <List size={16} />
                      </button>
                      <div className="w-px bg-gray-300 ml-auto"></div>
                      <button 
                        type="button"
                        onClick={() => setShowMediaPicker(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-[#007BFF] bg-[#007BFF] text-white rounded hover:bg-blue-700 transition-all text-[10px] font-black"
                      >
                        <LucideImage size={14} /> VLOŽIT MÉDIA
                      </button>
                    </div>

                    {/* Editor */}
                    <textarea 
                      id="editor-content"
                      value={contentHTML}
                      onChange={e => setContentHTML(e.target.value)}
                      placeholder="Piš obsah článku zde... Můžeš používat Markdown: **tučný**, *kurzíva*, # nadpis, - seznam..."
                      rows={15}
                      className="w-full px-4 py-4 border border-t-0 border-gray-200 rounded-b font-mono text-sm resize-none focus:border-[#007BFF] outline-none focus:border-t focus:border-gray-200"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded p-4 text-[10px] text-gray-700">
                    <p className="font-black uppercase tracking-widest mb-2">💡 Markdown tipy:</p>
                    <ul className="space-y-1 font-mono text-[9px]">
                      <li>**text** = <strong>tučný text</strong></li>
                      <li>*text* = <em>kurzíva</em></li>
                      <li>## Nadpis = velký nadpis</li>
                      <li>- položka = seznam</li>
                      <li>![alt](url) = obrázek</li>
                    </ul>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Cover Image */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-600 tracking-widest mb-2">
                      Titulní foto
                    </label>
                    <div className="aspect-video bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center overflow-hidden relative group">
                      {formData.coverImage ? (
                        <>
                          <img src={formData.coverImage} alt="" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, coverImage: ''})}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => setShowMediaPicker(true)}
                          className="flex flex-col items-center gap-2 text-gray-500 hover:text-[#007BFF] transition-colors"
                        >
                          <LucideImage size={24} />
                          <span className="text-[8px] font-black uppercase">Vybrat foto</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-600 tracking-widest mb-2">
                      Datum publikace
                    </label>
                    <input 
                      type="date"
                      value={formData.date || ''}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded focus:border-[#007BFF] outline-none"
                    />
                  </div>

                  {/* Author */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-600 tracking-widest mb-2">
                      Autor
                    </label>
                    <input 
                      type="text"
                      value={formData.author || ''}
                      onChange={e => setFormData({...formData, author: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded focus:border-[#007BFF] outline-none"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-600 tracking-widest mb-2">
                      Štítky
                    </label>
                    <input 
                      type="text"
                      value={formData.tags?.join(', ') || ''}
                      onChange={e => setFormData({
                        ...formData, 
                        tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                      })}
                      placeholder="tag1, tag2, tag3"
                      className="w-full px-4 py-2 border border-gray-200 rounded focus:border-[#007BFF] outline-none text-[10px]"
                    />
                  </div>

                  {/* Save Button */}
                  <button 
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-[#007BFF] text-white py-4 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all disabled:opacity-50 rounded flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        PUBLIKUJI...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        PUBLIKOVAT
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Picker */}
      <AnimatePresence>
        {showMediaPicker && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMediaPicker(false)}
            className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-lg overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col"
            >
              <div className="bg-gray-50 border-b p-6 flex justify-between items-center">
                <h3 className="text-xl font-black uppercase tracking-widest">Knihovna médií</h3>
                <button onClick={() => setShowMediaPicker(false)} className="p-2 hover:bg-gray-200 rounded">
                  <X size={24} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {allItems.map(item => (
                  <div 
                    key={item.id}
                    className="group relative aspect-square border-2 border-gray-200 rounded hover:border-[#007BFF] transition-all overflow-hidden cursor-pointer bg-gray-50"
                  >
                    {item.type === 'image' && (
                      <>
                        <img src={item.url} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                        <button 
                          onClick={() => {
                            formData.coverImage ? insertImage(item) : setFormData({...formData, coverImage: item.url});
                            setShowMediaPicker(false);
                          }}
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/60 flex items-center justify-center transition-all"
                        >
                          <span className="text-white text-[10px] font-black uppercase opacity-0 group-hover:opacity-100">Vybrat</span>
                        </button>
                      </>
                    )}
                    {item.type === 'video' && (
                      <>
                        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                          <LucideVideo size={24} className="text-gray-500" />
                        </div>
                        <button 
                          onClick={() => {insertVideo(item)}}
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/60 flex items-center justify-center transition-all"
                        >
                          <span className="text-white text-[10px] font-black uppercase opacity-0 group-hover:opacity-100">Vložit</span>
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlogManagerV2;
