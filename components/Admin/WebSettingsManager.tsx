
import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Image as ImageIcon, User, X, HardDrive, Wallet, Phone, Mail, 
  Globe, ChevronRight, Folder, MessageSquare, Instagram, Facebook, 
  Youtube, Linkedin, Info, Upload, Plus, FileText, Shield, 
  Bold, Italic, List, ListOrdered, RefreshCw, CheckCircle2, Search, MapPin, Building2,
  Type, AlignLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WebSettings, FileItem } from '../../types';
import { mediaDB, dataStore, storage, optimizeImage } from '../../lib/db';
import { SPECIALIZATIONS } from '../../constants';

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
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<FileItem[]>([]);

  // Editor Refs
  const homeAboutEditorRef = useRef<HTMLDivElement>(null);
  const price1EditorRef = useRef<HTMLDivElement>(null);
  const price2EditorRef = useRef<HTMLDivElement>(null);
  const privacyEditorRef = useRef<HTMLDivElement>(null);
  const termsEditorRef = useRef<HTMLDivElement>(null);
  
  const loadSettings = async () => {
    const saved = await dataStore.doc('web_settings').get();
    if (saved) {
      setSettings(prev => ({ ...prev, ...saved }));
      setTimeout(() => {
        if (homeAboutEditorRef.current) homeAboutEditorRef.current.innerHTML = saved.homeAboutText || '';
        if (price1EditorRef.current) price1EditorRef.current.innerHTML = saved.price1Desc || '';
        if (price2EditorRef.current) price2EditorRef.current.innerHTML = saved.price2Desc || '';
        if (privacyEditorRef.current) privacyEditorRef.current.innerHTML = saved.privacyContent || '';
        if (termsEditorRef.current) termsEditorRef.current.innerHTML = saved.termsContent || '';
      }, 200);
    }
    const dbItems = await mediaDB.getAll();
    setAllItems(dbItems);
  };

  useEffect(() => { loadSettings(); }, []);

  const saveSettings = async () => {
    const updatedSettings = {
      ...settings,
      homeAboutText: homeAboutEditorRef.current?.innerHTML || '',
      price1Desc: price1EditorRef.current?.innerHTML || '',
      price2Desc: price2EditorRef.current?.innerHTML || '',
      privacyContent: privacyEditorRef.current?.innerHTML || '',
      termsContent: termsEditorRef.current?.innerHTML || ''
    };
    await dataStore.doc('web_settings').set(updatedSettings);
    alert('Obsah webu byl úspěšně uložen!');
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
    setSettings({ ...settings, [pickerTarget]: url });
    setShowPicker(false);
  };

  const inputClass = "w-full bg-white text-black border-2 border-gray-100 p-4 text-sm font-bold focus:border-[#007BFF] outline-none transition-all placeholder:text-gray-300";
  
  const EditorToolbar = ({ onCommand }: { onCommand: (cmd: string, val?: string) => void }) => (
    <div className="bg-gray-100 border-b p-2 flex gap-1 flex-wrap">
      <button type="button" onClick={() => onCommand('bold')} className="p-1.5 hover:bg-white rounded transition-colors text-gray-700" title="Tučné"><Bold size={14}/></button>
      <button type="button" onClick={() => onCommand('italic')} className="p-1.5 hover:bg-white rounded transition-colors text-gray-700" title="Kurzíva"><Italic size={14}/></button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button type="button" onClick={() => onCommand('formatBlock', 'h3')} className="p-1.5 hover:bg-white rounded transition-colors text-gray-700 font-black text-[10px]">H3</button>
      <button type="button" onClick={() => onCommand('insertUnorderedList')} className="p-1.5 hover:bg-white rounded transition-colors text-gray-700" title="Seznam"><List size={14}/></button>
    </div>
  );

  return (
    <div className="space-y-12 pb-20">
      <div className="flex bg-white border p-1 max-w-5xl overflow-x-auto no-scrollbar">
        {[
          { id: 'visuals', label: 'Vizuály' },
          { id: 'content', label: 'Texty & O mně' },
          { id: 'footer', label: 'Kontakt & Ceník' },
          { id: 'docs', label: 'Dokumentace' }
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[140px] py-4 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#007BFF] text-white shadow-lg' : 'text-gray-400 hover:text-black'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'visuals' && (
          <motion.div key="vis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-10 border shadow-sm space-y-10">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Profilová fotografie</label>
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-50 border shrink-0 overflow-hidden"><img src={settings.profilePic} className="w-full h-full object-cover" /></div>
                    <input type="text" value={settings.profilePic} onChange={e=>setSettings({...settings, profilePic:e.target.value})} className={inputClass} placeholder="URL..." />
                    <button onClick={() => openPicker('profilePic')} className="bg-black text-white px-6 shrink-0 transition-all hover:bg-[#007BFF]"><ImageIcon size={20}/></button>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Záhlaví kontaktu</label>
                  <div className="flex gap-4">
                    <input type="text" value={settings.contactHeader} onChange={e=>setSettings({...settings, contactHeader:e.target.value})} className={inputClass} placeholder="URL pozadí..." />
                    <button onClick={() => openPicker('contactHeader')} className="bg-black text-white px-6 shrink-0 transition-all hover:bg-[#007BFF]"><ImageIcon size={20}/></button>
                  </div>
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'content' && (
          <motion.div key="cont" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-10 border shadow-sm space-y-10">
             <div className="space-y-6">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Hlavní nadpis "O mně"</label>
                <input type="text" value={settings.homeAboutTitle} onChange={e=>setSettings({...settings, homeAboutTitle:e.target.value})} className={`${inputClass} text-2xl uppercase`} />
             </div>
             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Text "O mně" (WYSIWYG Editor)</label>
                <div className="border-2 border-gray-100 rounded-sm overflow-hidden">
                  <EditorToolbar onCommand={handleEditorCommand} />
                  <div ref={homeAboutEditorRef} contentEditable className="min-h-[300px] p-8 outline-none prose prose-lg max-w-none text-black bg-white" />
                </div>
             </div>
             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Krátké Bio (pro kontakt)</label>
                <textarea value={settings.bio} onChange={e=>setSettings({...settings, bio:e.target.value})} className={`${inputClass} h-32 resize-none`} />
             </div>
          </motion.div>
        )}

        {activeTab === 'footer' && (
          <motion.div key="footer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-10 border shadow-sm space-y-12">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase">IČO</label><input type="text" value={settings.ico} onChange={e=>setSettings({...settings, ico:e.target.value})} className={inputClass} /></div>
                <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase">Email</label><input type="text" value={settings.email} onChange={e=>setSettings({...settings, email:e.target.value})} className={inputClass} /></div>
                <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase">Telefon</label><input type="text" value={settings.phone} onChange={e=>setSettings({...settings, phone:e.target.value})} className={inputClass} /></div>
                <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase">Adresa</label><input type="text" value={settings.address} onChange={e=>setSettings({...settings, address:e.target.value})} className={inputClass} /></div>
             </div>

             <div className="pt-10 border-t space-y-10">
                <h3 className="text-sm font-black uppercase flex items-center gap-4 text-[#007BFF]"><Wallet size={18}/> Nastavení Ceníku</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6 p-6 bg-gray-50 border">
                      <input type="text" placeholder="Název 1" value={settings.price1Title} onChange={e=>setSettings({...settings, price1Title:e.target.value})} className={inputClass} />
                      <input type="text" placeholder="Cena 1" value={settings.price1Value} onChange={e=>setSettings({...settings, price1Value:e.target.value})} className={inputClass} />
                      <div className="bg-white border">
                        <EditorToolbar onCommand={handleEditorCommand} />
                        <div ref={price1EditorRef} contentEditable className="min-h-[150px] p-4 text-sm outline-none bg-white" />
                      </div>
                   </div>
                   <div className="space-y-6 p-6 bg-gray-50 border">
                      <input type="text" placeholder="Název 2" value={settings.price2Title} onChange={e=>setSettings({...settings, price2Title:e.target.value})} className={inputClass} />
                      <input type="text" placeholder="Cena 2" value={settings.price2Value} onChange={e=>setSettings({...settings, price2Value:e.target.value})} className={inputClass} />
                      <div className="bg-white border">
                        <EditorToolbar onCommand={handleEditorCommand} />
                        <div ref={price2EditorRef} contentEditable className="min-h-[150px] p-4 text-sm outline-none bg-white" />
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'docs' && (
          <motion.div key="docs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-10 border shadow-sm space-y-10">
             <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#007BFF]">Ochrana soukromí (GDPR)</h3>
                <div className="border-2 border-gray-100 rounded-sm">
                  <EditorToolbar onCommand={handleEditorCommand} />
                  <div ref={privacyEditorRef} contentEditable className="min-h-[300px] p-8 outline-none prose prose-sm max-w-none text-black bg-white" />
                </div>
             </div>
             <div className="space-y-6 pt-10 border-t">
                <h3 className="text-sm font-black uppercase tracking-widest text-black">Obchodní podmínky</h3>
                <div className="border-2 border-gray-100 rounded-sm">
                  <EditorToolbar onCommand={handleEditorCommand} />
                  <div ref={termsEditorRef} contentEditable className="min-h-[300px] p-8 outline-none prose prose-sm max-w-none text-black bg-white" />
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end pt-10 border-t">
        <button onClick={saveSettings} className="bg-[#007BFF] text-white px-20 py-6 text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-black transition-all">
          <RefreshCw size={16} className="inline mr-4" /> ULOŽIT ZMĚNY
        </button>
      </div>

      {/* Media Picker Modal */}
      <AnimatePresence>
        {showPicker && (
          <div className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center p-12" onClick={()=>setShowPicker(false)}>
            <div className="bg-white w-full max-w-6xl h-[85vh] flex flex-col rounded-sm overflow-hidden" onClick={e=>e.stopPropagation()}>
               <div className="p-8 border-b flex justify-between items-center bg-gray-50 text-black">
                  <h3 className="text-xl font-black uppercase">Vybrat médium</h3>
                  <button onClick={()=>setShowPicker(false)} className="text-black hover:text-red-500"><X size={32}/></button>
               </div>
               <div className="p-10 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-6 overflow-y-auto bg-gray-50/20">
                  {allItems.filter(i => i.type !== 'folder').map(item => (
                    <div key={item.id} onClick={() => selectFromPicker(item.url!)} className="relative aspect-square border-2 border-transparent hover:border-[#007BFF] p-1 cursor-pointer bg-white group">
                       <img src={item.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"/>
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

export default WebSettingsManager;
