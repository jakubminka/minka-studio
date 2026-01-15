
import React, { useState, useEffect, useRef } from 'react';
import { Project, MediaType, FileItem } from '../../types';
import { SPECIALIZATIONS, PROJECTS as INITIAL_PROJECTS } from '../../constants';
import { 
  Plus, Trash2, Edit2, X, Search, Youtube, HardDrive, ChevronRight, Folder, Upload, RefreshCw, Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mediaDB, dataStore } from '../../lib/db';

const ProjectManager: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'thumbnail' | 'gallery'>('thumbnail');
  const [pickerFolderId, setPickerFolderId] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<FileItem[]>([]);
  const [isPickerUploading, setIsPickerUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Project>>({
    title: '', description: '', shortDescription: '', categoryId: SPECIALIZATIONS[0].id,
    type: MediaType.BOTH, date: new Date().toISOString().split('T')[0],
    thumbnailUrl: '', thumbnailSource: 'pc', gallery: [], servicesDelivered: ''
  });

  const loadData = async () => {
    const savedProjects = await dataStore.collection('projects').getAll();
    // Pokud máme v DB data, použijeme je, jinak ukážeme výchozí konstanty
    setProjects(savedProjects.length > 0 ? savedProjects : INITIAL_PROJECTS);
    
    const dbItems = await mediaDB.getAll();
    setAllItems(dbItems.map(i => ({ ...i, parentId: i.parentId || null })));
  };

  useEffect(() => {
    loadData();
    // Naslouchání na změny z jiných oken (např. pokud máš admina ve dvou tabech)
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const resetForm = () => {
    setFormData({
      title: '', description: '', shortDescription: '', categoryId: SPECIALIZATIONS[0].id,
      type: MediaType.BOTH, date: new Date().toISOString().split('T')[0],
      thumbnailUrl: '', thumbnailSource: 'pc', gallery: [], servicesDelivered: ''
    });
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    const project: Project = {
      id: editingId || Math.random().toString(36).substr(2,9),
      title: formData.title!,
      category: SPECIALIZATIONS.find(s => s.id === formData.categoryId)?.name || 'Ostatní',
      categoryId: formData.categoryId!,
      description: formData.description || '',
      shortDescription: formData.shortDescription || '',
      thumbnailUrl: formData.thumbnailUrl || '',
      thumbnailSource: formData.thumbnailSource as any || 'pc',
      type: formData.type || MediaType.BOTH,
      date: formData.date || new Date().toISOString().split('T')[0],
      gallery: formData.gallery || [],
      servicesDelivered: formData.servicesDelivered || ''
    };

    await dataStore.collection('projects').save(project);
    await loadData(); // Kritické: Znovu načíst data do UI po uložení
    setShowForm(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Smazat tento projekt?')) {
      await dataStore.collection('projects').delete(id);
      await loadData(); // Kritické: Znovu načíst data po smazání
    }
  };

  const openPicker = (target: 'thumbnail' | 'gallery') => {
    setPickerTarget(target);
    setShowPicker(true);
  };

  const handleFileSelect = (file: FileItem) => {
    if (file.type === 'folder') {
      setPickerFolderId(file.id);
      return;
    }
    if (pickerTarget === 'thumbnail') {
      setFormData(prev => ({ ...prev, thumbnailUrl: file.url, thumbnailSource: 'storage' }));
    } else {
      setFormData(prev => ({ ...prev, gallery: [...(prev.gallery || []), { id: file.id, type: file.type === 'video' ? 'video' : 'image', url: file.url!, source: 'storage' }] }));
    }
    setShowPicker(false);
  };

  const breadcrumbs = [];
  let tempId = pickerFolderId;
  while (tempId) {
    const f = allItems.find(i => i.id === tempId);
    if (f) { breadcrumbs.unshift(f); tempId = f.parentId; } else tempId = null;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 border flex justify-between items-center shadow-sm">
        <button 
          onClick={() => { resetForm(); setShowForm(true); }} 
          className="bg-[#007BFF] text-white px-8 py-3.5 text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
        >
          <Plus className="inline mr-2" size={16} /> Přidat zakázku
        </button>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Hledat v zakázkách..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="pl-10 pr-4 py-3 border text-sm w-80 text-black bg-white font-black uppercase tracking-widest" 
          />
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border p-12 relative shadow-2xl">
            <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 text-gray-400 hover:text-black"><X size={32} /></button>
            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-16">
               <div className="space-y-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Název projektu</label>
                    <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border-4 border-gray-100 p-5 font-black text-black bg-white focus:border-[#007BFF] outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Obor / Kategorie</label>
                    <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full border-4 border-gray-100 p-5 uppercase font-black text-black bg-white focus:border-[#007BFF]">
                      {SPECIALIZATIONS.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Příběh a detaily realizace</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border-4 border-gray-100 p-5 h-64 font-medium text-black bg-white resize-none focus:border-[#007BFF]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Dodané služby (každá na nový řádek)</label>
                    <textarea value={formData.servicesDelivered} onChange={e => setFormData({...formData, servicesDelivered: e.target.value})} className="w-full border-4 border-gray-100 p-5 h-32 font-medium text-black bg-white resize-none focus:border-[#007BFF]" placeholder="např. Focení exteriérů&#10;Video z dronu" />
                  </div>
               </div>
               <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Hlavní náhled (Video/Foto)</label>
                    <div className="aspect-video bg-gray-50 border-4 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group">
                       {formData.thumbnailUrl ? (
                         <div className="w-full h-full relative">
                           {formData.thumbnailSource === 'youtube' ? <iframe src={formData.thumbnailUrl} className="w-full h-full pointer-events-none" /> : <img src={formData.thumbnailUrl} className="w-full h-full object-cover" />}
                           <button type="button" onClick={() => setFormData({...formData, thumbnailUrl: ''})} className="absolute top-4 right-4 bg-red-600 text-white p-3 shadow-xl hover:bg-black transition-colors"><X size={24} /></button>
                         </div>
                       ) : (
                         <div className="flex gap-6">
                            <button type="button" onClick={() => openPicker('thumbnail')} className="flex flex-col items-center gap-3 p-8 bg-white border-2 hover:border-[#007BFF] text-[#007BFF] transition-all shadow-sm">
                              <HardDrive size={32} />
                              <span className="text-[10px] font-black tracking-widest">ÚLOŽIŠTĚ</span>
                            </button>
                         </div>
                       )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Galerie výstupů ({formData.gallery?.length || 0})</label>
                    <div className="grid grid-cols-5 gap-3 bg-gray-50 p-4 border border-gray-100 min-h-[160px]">
                       {formData.gallery?.map((item, i) => (
                         <div key={i} className="aspect-square bg-white border border-gray-100 relative group shadow-sm overflow-hidden">
                            {item.source === 'youtube' ? <div className="w-full h-full bg-black flex items-center justify-center text-white"><Video size={24} /></div> : <img src={item.url} className="w-full h-full object-cover" />}
                            <button type="button" onClick={() => setFormData({...formData, gallery: formData.gallery?.filter((_, idx) => idx !== i)})} className="absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-all"><Trash2 size={24} /></button>
                         </div>
                       ))}
                       <button type="button" onClick={() => openPicker('gallery')} className="aspect-square border-4 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:text-[#007BFF] hover:border-[#007BFF] transition-all"><Plus size={32} /></button>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-black text-white py-6 text-[12px] font-black uppercase tracking-[0.5em] hover:bg-[#007BFF] transition-all shadow-2xl">PUBLIKOVAT PROJEKT</button>
               </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white border border-gray-100 shadow-sm rounded-sm">
        <table className="w-full text-left">
           <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Název zakázky</th><th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Kategorie</th><th className="px-8 py-5 text-right text-[11px] font-black uppercase tracking-widest text-gray-400">Možnosti</th></tr></thead>
           <tbody>
             {projects.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
               <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 group">
                 <td className="px-8 py-5 font-black text-sm uppercase tracking-tight text-black">{p.title}</td>
                 <td className="px-8 py-5 text-[10px] font-black text-[#007BFF] uppercase tracking-widest">{p.category}</td>
                 <td className="px-8 py-5 text-right space-x-3">
                    <button onClick={() => { setEditingId(p.id); setFormData(p); setShowForm(true); }} className="p-3 text-gray-400 hover:text-black hover:bg-white rounded-sm transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-3 text-gray-400 hover:text-red-600 hover:bg-white rounded-sm transition-all"><Trash2 size={16} /></button>
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showPicker && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md" onClick={() => setShowPicker(false)}>
             <div className="bg-white w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden rounded-sm" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b flex justify-between items-center bg-gray-50">
                  <h3 className="text-xl font-black uppercase tracking-widest">Výběr z knihovny</h3>
                  <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-black"><X size={32} /></button>
                </div>
                <div className="px-8 py-4 bg-white border-b flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase">
                  <button onClick={() => setPickerFolderId(null)} className={!pickerFolderId ? 'text-black' : ''}>ROOT</button>
                  {breadcrumbs.map(f => (
                    <React.Fragment key={f.id}><ChevronRight size={14} /><button onClick={() => setPickerFolderId(f.id)} className={pickerFolderId === f.id ? 'text-black' : ''}>{f.name}</button></React.Fragment>
                  ))}
                </div>
                <div className="flex-grow p-8 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 gap-6 bg-gray-50/20">
                  {allItems.filter(i => i.parentId === pickerFolderId).map(item => (
                    <div key={item.id} onClick={() => handleFileSelect(item)} className="bg-white border-2 border-transparent hover:border-[#007BFF] p-3 cursor-pointer group flex flex-col items-center">
                       <div className="w-full aspect-square bg-gray-100 flex items-center justify-center mb-2 overflow-hidden">
                          {item.type === 'folder' ? <Folder size={40} className="text-[#007BFF]/10 group-hover:text-[#007BFF]" /> : <img src={item.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0" />}
                       </div>
                       <p className="text-[9px] font-black uppercase truncate w-full text-center text-gray-400 group-hover:text-black">{item.name}</p>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectManager;
