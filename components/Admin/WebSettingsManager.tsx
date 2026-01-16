
import React, { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, User, X, HardDrive, Wallet, Phone, Mail, Globe, ChevronRight, Folder, MessageSquare, Instagram, Facebook, Youtube, Linkedin, Info, Upload, Plus, FileText, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WebSettings, FileItem } from '../../types';
import { mediaDB, dataStore } from '../../lib/db';
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
  
  const loadSettings = async () => {
    const saved = await dataStore.doc('web_settings').get();
    if (saved) setSettings(prev => ({ ...prev, ...saved }));
  };

  useEffect(() => { loadSettings(); }, []);

  const saveSettings = async () => {
    await dataStore.doc('web_settings').set(settings);
    alert('Nastavení uloženo do cloudu!');
  };

  const inputClass = "w-full bg-white text-black border-2 border-gray-100 p-4 text-sm font-bold focus:border-[#007BFF] outline-none transition-all placeholder:text-gray-300";

  return (
    <div className="space-y-12 pb-20">
      <div className="flex bg-white border p-1 max-w-4xl overflow-x-auto no-scrollbar">
        {[
          { id: 'visuals', label: 'Vizuály' },
          { id: 'content', label: 'Texty' },
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
                  <input type="text" value={settings.profilePic} onChange={e=>setSettings({...settings, profilePic:e.target.value})} className={inputClass} placeholder="URL..." />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Portfolio Header</label>
                  <input type="text" value={settings.portfolioHeader} onChange={e=>setSettings({...settings, portfolioHeader:e.target.value})} className={inputClass} placeholder="URL..." />
                </div>
             </div>
             <div className="pt-8 border-t space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest">Bannery pro specializace</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {SPECIALIZATIONS.filter(s=>!s.externalUrl).map(spec => (
                     <div key={spec.id} className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-gray-400">{spec.name}</label>
                        <input type="text" value={settings.specializationHeaders[spec.id] || ''} onChange={e=>setSettings({...settings, specializationHeaders: {...settings.specializationHeaders, [spec.id]: e.target.value}})} className="w-full border p-2 text-[10px] font-bold" />
                     </div>
                   ))}
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'backstage' && (
          <motion.div key="bts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-10 border shadow-sm space-y-10">
             <h3 className="text-sm font-black uppercase">Fotky "Behind the scenes"</h3>
             <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
               {settings.backstage?.map((url, i) => (
                 <div key={i} className="aspect-square relative group">
                   <img src={url} className="w-full h-full object-cover grayscale" />
                   <button onClick={() => setSettings({...settings, backstage: settings.backstage.filter((_, idx) => idx !== i)})} className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center"><X size={24}/></button>
                 </div>
               ))}
               <button onClick={() => {const u=prompt('URL fotky:'); if(u) setSettings({...settings, backstage:[...settings.backstage, u]})}} className="aspect-square border-4 border-dashed border-gray-100 flex items-center justify-center text-gray-200 hover:text-[#007BFF] hover:border-[#007BFF] transition-all"><Plus size={32}/></button>
             </div>
          </motion.div>
        )}

        {activeTab === 'content' && (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-10 border shadow-sm space-y-10">
             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400">Bio / O mně (Kontakt)</label>
                <textarea value={settings.bio} onChange={e=>setSettings({...settings, bio:e.target.value})} className={`${inputClass} h-48 resize-none`} />
             </div>
             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400">Popis v patičce</label>
                <textarea value={settings.footerDescription} onChange={e=>setSettings({...settings, footerDescription:e.target.value})} className={`${inputClass} h-24 resize-none`} />
             </div>
          </motion.div>
        )}

        {activeTab === 'footer' && (
          <motion.div key="footer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-10 border shadow-sm space-y-10">
             <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4"><label className="text-[10px] font-black text-gray-400 uppercase">IČO</label><input type="text" value={settings.ico} onChange={e=>setSettings({...settings, ico:e.target.value})} className={inputClass} /></div>
                <div className="space-y-4"><label className="text-[10px] font-black text-gray-400 uppercase">DIČ</label><input type="text" value={settings.dic} onChange={e=>setSettings({...settings, dic:e.target.value})} className={inputClass} /></div>
                <div className="space-y-4"><label className="text-[10px] font-black text-gray-400 uppercase">Email</label><input type="text" value={settings.email} onChange={e=>setSettings({...settings, email:e.target.value})} className={inputClass} /></div>
                <div className="space-y-4"><label className="text-[10px] font-black text-gray-400 uppercase">Telefon</label><input type="text" value={settings.phone} onChange={e=>setSettings({...settings, phone:e.target.value})} className={inputClass} /></div>
             </div>
             <div className="space-y-6 border-t pt-8">
                <h3 className="text-xs font-black uppercase flex items-center gap-4"><Instagram size={20}/> Sociální sítě</h3>
                <div className="grid grid-cols-2 gap-6">
                   <input type="text" value={settings.instagramUrl} onChange={e=>setSettings({...settings, instagramUrl:e.target.value})} className={inputClass} placeholder="Instagram URL" />
                   <input type="text" value={settings.linkedinUrl} onChange={e=>setSettings({...settings, linkedinUrl:e.target.value})} className={inputClass} placeholder="LinkedIn URL" />
                   <input type="text" value={settings.facebookUrl} onChange={e=>setSettings({...settings, facebookUrl:e.target.value})} className={inputClass} placeholder="Facebook URL" />
                   <input type="text" value={settings.youtubeUrl} onChange={e=>setSettings({...settings, youtubeUrl:e.target.value})} className={inputClass} placeholder="YouTube URL" />
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'docs' && (
          <motion.div key="docs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-10 border shadow-sm space-y-10">
             <div className="space-y-6">
                <div className="flex items-center gap-3 text-[#007BFF]">
                   <Shield size={20} />
                   <h3 className="text-sm font-black uppercase tracking-widest">Ochrana osobních údajů (Privacy Policy)</h3>
                </div>
                <textarea 
                  value={settings.privacyContent || ''} 
                  onChange={e=>setSettings({...settings, privacyContent:e.target.value})} 
                  className={`${inputClass} h-64 font-medium`} 
                  placeholder="Vložte text zásad ochrany soukromí..."
                />
             </div>
             <div className="space-y-6 border-t pt-10">
                <div className="flex items-center gap-3 text-black">
                   <FileText size={20} />
                   <h3 className="text-sm font-black uppercase tracking-widest">Podmínky spolupráce (Terms & Conditions)</h3>
                </div>
                <textarea 
                  value={settings.termsContent || ''} 
                  onChange={e=>setSettings({...settings, termsContent:e.target.value})} 
                  className={`${inputClass} h-64 font-medium`} 
                  placeholder="Vložte text obchodních podmínek..."
                />
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end"><button onClick={saveSettings} className="bg-[#007BFF] text-white px-20 py-6 text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-black transition-all">ULOŽIT DO CLOUDU</button></div>
    </div>
  );
};

export default WebSettingsManager;
