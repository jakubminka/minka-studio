
import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Image as ImageIcon, User, X, HardDrive, Wallet, Phone, Mail, 
  Globe, ChevronRight, Folder, MessageSquare, Instagram, Facebook, 
  Youtube, Linkedin, Info, Upload, Plus, FileText, Shield, 
  Bold, Italic, List, ListOrdered, RefreshCw, CheckCircle2, Search, MapPin, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WebSettings, FileItem } from '../../types';
import { mediaDB, dataStore, storage, optimizeImage } from '../../lib/db';
import { SPECIALIZATIONS } from '../../constants';
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const WebSettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<WebSettings>({
    portfolioHeader: '', contactHeader: '', blogHeader: '', specializationHeaders: {},
    profilePic: '', bio: '', homeAboutTitle: '', homeAboutText: '',
    ico: '', dic: '', address: '', phone: '', email: '', footerDescription: '',
    doc1Name: 'Ochrana soukromí', doc1Url: '#', doc2Name: 'Podmínky spolupráce', doc2Url: '#',
    backstage: [], instagramUrl: '', facebookUrl: '', youtubeUrl: '', linkedinUrl: '',
    pricingTitle: '', pricingSubtitle: '',
    price1Title: '', price1Value: '', price1Desc: '',
    price2Title: '', price2Value: '', price2Desc: '',
    pricingCta: '',
    privacyContent: '',
    termsContent: ''
  });

  const [activeTab, setActiveTab] = useState<'visuals' | 'content' | 'backstage' | 'footer' | 'docs'>('visuals');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const privacyEditorRef = useRef<HTMLDivElement>(null);
  const termsEditorRef = useRef<HTMLDivElement>(null);
  
  const loadSettings = async () => {
    const saved = await dataStore.doc('web_settings').get();
    if (saved) {
      setSettings(prev => ({ ...prev, ...saved }));
      setTimeout(() => {
        if (privacyEditorRef.current) privacyEditorRef.current.innerHTML = saved.privacyContent || '';
        if (termsEditorRef.current) termsEditorRef.current.innerHTML = saved.termsContent || '';
      }, 100);
    }
    const dbItems = await mediaDB.getAll();
    setAllItems(dbItems);
  };

  useEffect(() => { loadSettings(); }, []);

  const saveSettings = async () => {
    const updatedSettings = {
      ...settings,
      privacyContent: privacyEditorRef.current?.innerHTML || '',
      termsContent: termsEditorRef.current?.innerHTML || ''
    };
    await dataStore.doc('web_settings').set(updatedSettings);
    alert('Nastavení uloženo do cloudu!');
  };

  const handleEditorCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const openPicker = (target: string) => {
    setPickerTarget(target);
    setShowPicker(true);
  };

  const selectFromPicker = (url: string) => {
    if (!pickerTarget) return;
    if (pickerTarget.startsWith('spec-')) {
      const specId = pickerTarget.replace('spec-', '');
      setSettings({
        ...settings,
        specializationHeaders: { ...settings.specializationHeaders, [specId]: url }
      });
    } else if (pickerTarget === 'backstage-add') {
      setSettings({...settings, backstage: [...(settings.backstage || []), url]});
    } else {
      setSettings({ ...settings, [pickerTarget]: url });
    }
    setShowPicker(false);
  };

  const handlePickerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    setIsProcessing(true);
    const file = e.target.files[0];
    const quality = parseFloat(localStorage.getItem('jakub_minka_compression_quality') || '0.8');
    
    try {
      const optimized = await optimizeImage(file, quality / 100);
      const fileId = 'm-' + Math.random().toString(36).substr(2, 9);
      const sRef = ref(storage, `uploads/${fileId}_${file.name}`);
      const task = uploadBytesResumable(sRef, optimized);
      
      await new Promise((resolve, reject) => {
        task.on('state_changed', null, reject, async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          const newItem: FileItem = { 
            id: fileId, name: file.name, type: 'image', url, 
            parentId: null, updatedAt: new Date().toISOString() 
          };
          await mediaDB.save(newItem);
          setAllItems(prev => [newItem, ...prev]);
          selectFromPicker(url);
          resolve(true);
        });
      });
    } catch (err) {
      alert('Chyba při nahrávání: ' + err);
    }
    setIsProcessing(false);
  };

  const inputClass = "w-full bg-white text-black border-2 border-gray-100 p-4 text-sm font-bold focus:border-[#007BFF] outline-none transition-all placeholder:text-gray-300";

  const filteredItems = allItems.filter(i => 
    i.type !== 'folder' && 
    (i.name.toLowerCase().includes(searchQuery.toLowerCase()) || (i.url && i.url.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="space-y-12 pb-20">
      <div className="flex bg-white border p-1 max-w-4xl overflow-x-auto no-scrollbar">
        {[
          { id: 'visuals', label: 'Vizuály' },
          { id: 'content', label: 'Texty & Bio' },
          { id: 'backstage', label: 'Backstage' },
          { id: 'footer', label: 'Kontakt & Sociály' },
          { id: 'docs', label: 'Dokumenty (GDPR/OP)' }
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[120px] py-4 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#007BFF] text-white' : 'text-gray-400 hover:text-black'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'visuals' && (
          <motion.div key="vis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-10 border shadow-sm space-y-12">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Profilová fotografie</label>
                  <div className="flex gap-4">
                    <input type="text" value={settings.profilePic} onChange={e=>setSettings({...settings, profilePic:e.target.value})} className={inputClass} placeholder="URL..." />
                    <button onClick={() => openPicker('profilePic')} className="bg-black text-white px-6 shrink-0 transition-all hover:bg-[#007BFF]"><ImageIcon size={20}/></button>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Contact Header</label>
                  <div className="flex gap-4">
                    <input type="text" value={settings.contactHeader} onChange={e=>setSettings({...settings, contactHeader:e.target.value})} className={inputClass} placeholder="URL..." />
                    <button onClick={() => openPicker('contactHeader')} className="bg-black text-white px-6 shrink-0 transition-all hover:bg-[#007BFF]"><ImageIcon size={20}/></button>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Portfolio Header</label>
                  <div className="flex gap-4">
                    <input type="text" value={settings.portfolioHeader} onChange={e=>setSettings({...settings, portfolioHeader:e.target.value})} className={inputClass} placeholder="URL..." />
                    <button onClick={() => openPicker('portfolioHeader')} className="bg-black text-white px-6 shrink-0 transition-all hover:bg-[#007BFF]"><ImageIcon size={20}/></button>
                  </div>
                </div>
             </div>
             <div className="pt-8 border-t space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest">Bannery pro specializace</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {SPECIALIZATIONS.filter(s=>!s.externalUrl).map(spec => (
                     <div key={spec.id} className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-gray-400">{spec.name}</label>
                        <div className="flex gap-2">
                          <input type="text" value={settings.specializationHeaders[spec.id] || ''} onChange={e=>setSettings({...settings, specializationHeaders: {...settings.specializationHeaders, [spec.id]: e.target.value}})} className="w-full border p-2 text-[10px] font-bold" />
                          <button onClick={() => openPicker(`spec-${spec.id}`)} className="bg-gray-100 p-2 hover:bg-[#007BFF] hover:text-white transition-all"><ImageIcon size={14}/></button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'content' && (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-10 border shadow-sm space-y-10">
             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Bio / O mně (Krátký text na Kontakt)</label>
                <textarea value={settings.bio} onChange={e=>setSettings({...settings, bio:e.target.value})} className="w-full border-2 border-gray-100 p-6 h-32 font-bold focus:border-[#007BFF] outline-none" />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t">
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nadpis "O mně" (Home)</label>
                  <input type="text" value={settings.homeAboutTitle} onChange={e=>setSettings({...settings, homeAboutTitle:e.target.value})} className={inputClass} />
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Text "O mně" (Home)</label>
                  <textarea value={settings.homeAboutText} onChange={e=>setSettings({...settings, homeAboutText:e.target.value})} className="w-full border-2 border-gray-100 p-6 h-48 font-bold focus:border-[#007BFF] outline-none" />
               </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'docs' && (
          <motion.div key="docs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-10 border shadow-sm space-y-10">
             <div className="space-y-6">
                <div className="flex items-center gap-3 text-[#007BFF]">
                   <Shield size={20} />
                   <h3 className="text-sm font-black uppercase tracking-widest">Ochrana osobních údajů</h3>
                </div>
                <div className="border-4 border-gray-50">
                  <div className="bg-gray-50 border-b p-3 flex gap-2">
                    <button type="button" onClick={() => handleEditorCommand('formatBlock', 'H2')} className="p-2 border bg-white font-black text-xs hover:bg-black hover:text-white">H2</button>
                    <button type="button" onClick={() => handleEditorCommand('formatBlock', 'H3')} className="p-2 border bg-white font-black text-xs hover:bg-black hover:text-white">H3</button>
                    <button type="button" onClick={() => handleEditorCommand('bold')} className="p-2 border bg-white hover:bg-[#007BFF] hover:text-white"><Bold size={16}/></button>
                    <button type="button" onClick={() => handleEditorCommand('italic')} className="p-2 border bg-white hover:bg-[#007BFF] hover:text-white"><Italic size={16}/></button>
                    <button type="button" onClick={() => handleEditorCommand('insertUnorderedList')} className="p-2 border bg-white hover:bg-[#007BFF] hover:text-white"><List size={16}/></button>
                  </div>
                  <div ref={privacyEditorRef} contentEditable className="min-h-[300px] p-8 outline-none prose prose-sm max-w-none text-gray-800 bg-white" />
                </div>
             </div>
             
             <div className="space-y-6 border-t pt-10">
                <div className="flex items-center gap-3 text-black">
                   <FileText size={20} />
                   <h3 className="text-sm font-black uppercase tracking-widest">Podmínky spolupráce</h3>
                </div>
                <div className="border-4 border-gray-50">
                  <div className="bg-gray-50 border-b p-3 flex gap-2">
                    <button type="button" onClick={() => handleEditorCommand('formatBlock', 'H2')} className="p-2 border bg-white font-black text-xs hover:bg-black hover:text-white">H2</button>
                    <button type="button" onClick={() => handleEditorCommand('formatBlock', 'H3')} className="p-2 border bg-white font-black text-xs hover:bg-black hover:text-white">H3</button>
                    <button type="button" onClick={() => handleEditorCommand('bold')} className="p-2 border bg-white hover:bg-[#007BFF] hover:text-white"><Bold size={16}/></button>
                    <button type="button" onClick={() => handleEditorCommand('italic')} className="p-2 border bg-white hover:bg-[#007BFF] hover:text-white"><Italic size={16}/></button>
                    <button type="button" onClick={() => handleEditorCommand('insertUnorderedList')} className="p-2 border bg-white hover:bg-[#007BFF] hover:text-white"><List size={16}/></button>
                  </div>
                  <div ref={termsEditorRef} contentEditable className="min-h-[300px] p-8 outline-none prose prose-sm max-w-none text-gray-800 bg-white" />
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'backstage' && (
          <motion.div key="bts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-10 border shadow-sm space-y-10">
             <h3 className="text-sm font-black uppercase">Fotky "Behind the scenes" (Kontakt)</h3>
             <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
               {settings.backstage?.map((url, i) => (
                 <div key={i} className="aspect-square relative group border">
                   <img src={url} className="w-full h-full object-cover grayscale" />
                   <button onClick={() => setSettings({...settings, backstage: settings.backstage.filter((_, idx) => idx !== i)})} className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><X size={24}/></button>
                 </div>
               ))}
               <button onClick={() => openPicker('backstage-add')} className="aspect-square border-4 border-dashed border-gray-100 flex items-center justify-center text-gray-200 hover:text-[#007BFF] hover:border-[#007BFF] transition-all"><Plus size={32}/></button>
             </div>
          </motion.div>
        )}

        {activeTab === 'footer' && (
          <motion.div key="footer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-10 border shadow-sm space-y-12">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2"><Building2 size={12}/> IČO</label>
                  <input type="text" value={settings.ico} onChange={e=>setSettings({...settings, ico:e.target.value})} className={inputClass} />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2"><Shield size={12}/> DIČ</label>
                  <input type="text" value={settings.dic} onChange={e=>setSettings({...settings, dic:e.target.value})} className={inputClass} placeholder="Pokud nejste plátce, nechte prázdné" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2"><Mail size={12}/> Hlavní Email</label>
                  <input type="text" value={settings.email} onChange={e=>setSettings({...settings, email:e.target.value})} className={inputClass} />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2"><Phone size={12}/> Telefon</label>
                  <input type="text" value={settings.phone} onChange={e=>setSettings({...settings, phone:e.target.value})} className={inputClass} />
                </div>
                <div className="space-y-4 col-span-full">
                  <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2"><MapPin size={12}/> Adresa / Působiště</label>
                  <input type="text" value={settings.address} onChange={e=>setSettings({...settings, address:e.target.value})} className={inputClass} />
                </div>
                <div className="space-y-4 col-span-full">
                   <label className="text-[10px] font-black text-gray-400 uppercase">Patička - Popis pod logem</label>
                   <textarea value={settings.footerDescription} onChange={e=>setSettings({...settings, footerDescription:e.target.value})} className="w-full border-2 border-gray-100 p-6 h-24 font-bold focus:border-[#007BFF] outline-none" />
                </div>
             </div>

             <div className="space-y-8 border-t pt-10">
                <h3 className="text-sm font-black uppercase flex items-center gap-4">Sociální sítě</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-2"><Instagram size={12}/> Instagram URL</label>
                     <input type="text" value={settings.instagramUrl} onChange={e=>setSettings({...settings, instagramUrl:e.target.value})} className={inputClass} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-2"><Linkedin size={12}/> LinkedIn URL</label>
                     <input type="text" value={settings.linkedinUrl} onChange={e=>setSettings({...settings, linkedinUrl:e.target.value})} className={inputClass} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-2"><Facebook size={12}/> Facebook URL</label>
                     <input type="text" value={settings.facebookUrl} onChange={e=>setSettings({...settings, facebookUrl:e.target.value})} className={inputClass} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-2"><Youtube size={12}/> YouTube URL</label>
                     <input type="text" value={settings.youtubeUrl} onChange={e=>setSettings({...settings, youtubeUrl:e.target.value})} className={inputClass} />
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end pt-10 border-t">
        <button onClick={saveSettings} className="bg-[#007BFF] text-white px-20 py-6 text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-black transition-all">
          ULOŽIT ZMĚNY NA WEB
        </button>
      </div>

      {/* Media Picker Modal */}
      <AnimatePresence>
        {showPicker && (
          <div className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center p-12" onClick={()=>setShowPicker(false)}>
            <div className="bg-white w-full max-w-6xl h-[85vh] flex flex-col rounded-sm overflow-hidden" onClick={e=>e.stopPropagation()}>
               <div className="p-8 border-b flex justify-between items-center bg-gray-50">
                  <h3 className="text-xl font-black uppercase">Vybrat médium</h3>
                  <div className="flex gap-4">
                    <div className="relative">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Hledat..." 
                        value={searchQuery} 
                        onChange={e=>setSearchQuery(e.target.value)} 
                        className="pl-12 pr-6 py-3 border text-[10px] font-black uppercase w-64" 
                      />
                    </div>
                    <input type="file" id="settings-picker-upload" className="hidden" onChange={handlePickerUpload} />
                    <label htmlFor="settings-picker-upload" className="flex items-center gap-2 px-6 py-3 bg-black text-white text-[10px] font-black uppercase cursor-pointer hover:bg-[#007BFF] transition-all">
                      {isProcessing ? <RefreshCw className="animate-spin" size={16}/> : <Upload size={16}/>} Nahrát nové
                    </label>
                    <button onClick={()=>setShowPicker(false)} className="hover:text-red-500 transition-colors"><X size={32}/></button>
                  </div>
               </div>
               <div className="p-10 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-6 overflow-y-auto bg-gray-50/20">
                  {filteredItems.map(item => (
                    <div key={item.id} onClick={() => selectFromPicker(item.url!)} className="relative aspect-square border-2 border-transparent hover:border-[#007BFF] p-1 cursor-pointer bg-white group shadow-sm transition-all">
                       <img src={item.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"/>
                       <div className="absolute inset-0 bg-[#007BFF]/0 group-hover:bg-[#007BFF]/10 transition-colors" />
                    </div>
                  ))}
                  {filteredItems.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-300 font-black uppercase tracking-widest">
                       Žádné soubory nenalezeny.
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WebSettingsManager;
