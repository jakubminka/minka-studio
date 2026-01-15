
import React, { useState, useEffect, useMemo } from 'react';
import { Save, Image as ImageIcon, User, X, HardDrive, Wallet, Phone, Mail, Globe, ChevronRight, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WebSettings, FileItem } from '../../types';
import { mediaDB } from '../../lib/db';

const WebSettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<WebSettings>({
    portfolioHeader: '', contactHeader: '', blogHeader: '', specializationHeaders: {},
    profilePic: '', bio: '', homeAboutTitle: '', homeAboutText: '',
    ico: '', dic: '', address: '', phone: '', email: '', footerDescription: '',
    doc1Name: 'Ochrana soukromí', doc1Url: '#', doc2Name: 'Podmínky spolupráce', doc2Url: '#',
    backstage: [], instagramUrl: '', facebookUrl: '', youtubeUrl: '', linkedinUrl: '',
    pricingTitle: 'Cena není fixní', pricingSubtitle: 'Investice do vizuálu',
    price1Title: 'Malé zakázky', price1Value: 'nižší tisíce Kč', price1Desc: 'Rychlé focení na sítě...',
    price2Title: 'Velké produkce', price2Value: 'desítky tisíc Kč', price2Desc: 'Celodenní produkce...',
    pricingCta: 'Poptat projekt →'
  });

  const [activeTab, setActiveTab] = useState<'visuals' | 'content' | 'footer'>('visuals');
  
  // Picker state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);
  const [pickerFolderId, setPickerFolderId] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<FileItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('jakub_minka_web_settings');
    if (saved) setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
    const loadFiles = async () => {
      const dbItems = await mediaDB.getAll();
      setAllItems(dbItems.map(i => ({...i, parentId: i.parentId || null})));
    };
    loadFiles();
  }, []);

  const handleFileSelect = (file: FileItem) => {
    if (file.type === 'folder') { setPickerFolderId(file.id); return; }
    if (pickerTarget) setSettings(prev => ({ ...prev, [pickerTarget]: file.url }));
    setShowPicker(false);
  };

  const saveSettings = () => {
    localStorage.setItem('jakub_minka_web_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event('storage'));
    alert('Uloženo!');
  };

  const pickerBreadcrumbs = useMemo(() => {
    const trail = [];
    let tid = pickerFolderId;
    while (tid) {
      const f = allItems.find(i => i.id === tid);
      if (f) { trail.unshift(f); tid = f.parentId; } else tid = null;
    }
    return trail;
  }, [allItems, pickerFolderId]);

  const inputClass = "w-full bg-white text-black border border-gray-200 p-4 text-sm font-bold focus:border-[#007BFF] outline-none transition-all placeholder:text-gray-300";

  return (
    <div className="space-y-12 pb-20">
      <div className="flex bg-white border p-1 max-w-xl">
        {['visuals', 'content', 'footer'].map((tab: any) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#007BFF] text-white' : 'text-gray-400 hover:text-black'}`}>{tab === 'visuals' ? 'Bannery' : tab === 'content' ? 'Obsah' : 'Patička'}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'visuals' && (
          <motion.div key="vis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-12 border shadow-sm space-y-12">
             <h2 className="text-2xl font-black uppercase tracking-widest flex items-center gap-6 border-b-4 border-black pb-6"><ImageIcon size={32} className="text-[#007BFF]" /> Hlavní vizuály</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {[
                  { l: 'Portfolio Header', f: 'portfolioHeader' },
                  { l: 'Kontakt Header', f: 'contactHeader' },
                  { l: 'Blog Header', f: 'blogHeader' },
                  { l: 'Profilová fotka', f: 'profilePic' }
                ].map(item => (
                  <div key={item.f} className="space-y-4">
                     <label className="text-[11px] font-black uppercase text-gray-400">{item.l}</label>
                     <div className="flex gap-4">
                        <input type="text" value={(settings as any)[item.f]} onChange={e => setSettings({...settings, [item.f]: e.target.value})} className={inputClass} placeholder="URL..." />
                        <button onClick={() => { setPickerTarget(item.f); setPickerFolderId(null); setShowPicker(true); }} className="bg-black text-white px-8 py-5 text-[10px] font-black uppercase flex items-center gap-3 shrink-0"><HardDrive size={18} /> ÚLOŽIŠTĚ</button>
                     </div>
                     {(settings as any)[item.f] && <img src={(settings as any)[item.f]} className="h-20 border shadow-sm" />}
                  </div>
                ))}
             </div>
          </motion.div>
        )}
        {/* Další sekce zůstávají podobné, jen s inputClass... */}
      </AnimatePresence>

      <div className="flex justify-end pt-12"><button onClick={saveSettings} className="bg-[#007BFF] text-white px-24 py-6 text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all">ULOŽIT ZMĚNY</button></div>

      {/* Picker modál (pro WebSettings) */}
      <AnimatePresence>
        {showPicker && (
          <div className="fixed inset-0 z-[1100] bg-black/95 flex items-center justify-center p-12" onClick={() => setShowPicker(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl rounded-sm overflow-hidden" onClick={e => e.stopPropagation()}>
               <div className="p-8 border-b flex justify-between items-center bg-gray-50">
                  <h3 className="text-xl font-black uppercase flex items-center gap-4"><HardDrive size={24} className="text-[#007BFF]" /> Vybrat z úložiště</h3>
                  <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-black transition-all p-2"><X size={48} /></button>
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
               <div className="flex-grow p-12 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 gap-8 bg-gray-50/20 custom-scrollbar">
                  {allItems.filter(i => i.parentId === pickerFolderId).map(item => (
                    <div key={item.id} onClick={() => handleFileSelect(item)} className="bg-white border-2 border-transparent hover:border-[#007BFF] p-3 cursor-pointer group flex flex-col items-center">
                       <div className="w-full aspect-square bg-gray-100 flex items-center justify-center mb-3 overflow-hidden">
                          {item.type === 'folder' ? <Folder size={48} className="text-[#007BFF]/10 group-hover:text-[#007BFF]" /> : <img src={item.url} className="w-full h-full object-cover" />}
                       </div>
                       <p className="text-[10px] font-black uppercase truncate w-full text-center text-gray-400 group-hover:text-black">{item.name}</p>
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

export default WebSettingsManager;
