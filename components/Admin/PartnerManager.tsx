
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Search, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Partner {
  id: string;
  name: string;
}

const PartnerManager: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('jakub_minka_partners');
    if (saved) {
      setPartners(JSON.parse(saved));
    } else {
      const initial = ["Skoda Auto", "Red Bull", "National Geographic", "STRABAG", "Metrostav", "Czech Tourism", "Volvo", "Siemens", "Apple", "Google"].map(n => ({ id: Math.random().toString(36).substr(2, 9), name: n }));
      setPartners(initial);
      localStorage.setItem('jakub_minka_partners', JSON.stringify(initial));
    }
  }, []);

  const saveToStorage = (updated: Partner[]) => {
    setPartners(updated);
    localStorage.setItem('jakub_minka_partners', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const partner = { id: Math.random().toString(36).substr(2, 9), name: newName.trim() };
    saveToStorage([partner, ...partners]);
    setNewName('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Opravdu chcete tohoto partnera odstranit?')) {
      saveToStorage(partners.filter(p => p.id !== id));
    }
  };

  const handleUpdate = (id: string, name: string) => {
    saveToStorage(partners.map(p => p.id === id ? { ...p, name } : p));
    setIsEditing(null);
  };

  const filtered = partners.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-sm border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <form onSubmit={handleAdd} className="flex items-center gap-4 flex-grow max-w-xl">
           <input 
             type="text" 
             value={newName} 
             onChange={e => setNewName(e.target.value)} 
             placeholder="Název firmy / partnera..." 
             className="flex-grow bg-gray-50 border border-gray-100 py-3.5 px-6 text-sm focus:outline-none focus:border-[#007BFF] text-black" 
           />
           <button type="submit" className="bg-[#007BFF] text-white px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-black transition-all">
             <Plus size={16} /> Přidat partnera
           </button>
        </form>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Hledat..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-gray-50 border border-gray-100 py-3.5 pl-12 pr-6 text-xs font-medium focus:outline-none focus:border-[#007BFF] text-black" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map(partner => (
          <div key={partner.id} className="bg-white p-6 border border-gray-100 rounded-sm flex items-center justify-between group hover:border-gray-200 transition-all">
            {isEditing === partner.id ? (
              <div className="flex items-center gap-2 w-full bg-white">
                <input 
                  type="text" 
                  defaultValue={partner.name} 
                  autoFocus
                  onBlur={(e) => handleUpdate(partner.id, e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdate(partner.id, (e.target as any).value)}
                  className="flex-grow border-2 border-[#007BFF] py-2 px-3 text-sm font-bold focus:outline-none bg-white text-black" 
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                   <Briefcase size={16} className="text-[#007BFF]" />
                   <span className="text-sm font-bold uppercase tracking-widest text-black">{partner.name}</span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setIsEditing(partner.id)} className="p-2 text-gray-300 hover:text-[#007BFF]"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(partner.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartnerManager;
