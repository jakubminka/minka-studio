
import React, { useState, useEffect } from 'react';
import { 
  Mail, Phone, MapPin, Instagram, Facebook, Youtube, Linkedin, 
  Briefcase, Info, ArrowUpRight, Camera, Send, CheckCircle2, 
  Shield, RefreshCw, FileText, Globe, Building2, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { WebSettings } from '../types';
import HumanVerificationModal from '../components/HumanVerificationModal';
import { dataStore } from '../lib/db';

const Contact: React.FC = () => {
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  
  const [settings, setSettings] = useState<WebSettings>({
    contactHeader: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&q=80&w=2000',
    blogHeader: '',
    profilePic: 'https://picsum.photos/id/64/800/800',
    bio: 'Profesionální fotograf a kameraman se smyslem pro detail a unikátní vizuální vyprávění.',
    ico: '',
    dic: '',
    address: 'Praha, Česká republika',
    phone: '',
    email: '',
    backstage: [],
    portfolioHeader: '',
    specializationHeaders: {},
    homeAboutTitle: '',
    homeAboutText: '',
    footerDescription: '',
    doc1Name: 'Ochrana soukromí',
    doc1Url: '/ochrana-soukromi',
    doc2Name: 'Podmínky spolupráce',
    doc2Url: '/podminky-spoluprace',
    instagramUrl: '#',
    facebookUrl: '#',
    youtubeUrl: '#',
    linkedinUrl: '#',
    pricingTitle: '',
    pricingSubtitle: '',
    price1Title: '',
    price1Value: '',
    price1Desc: '',
    price2Title: '',
    price2Value: '',
    price2Desc: '',
    pricingCta: '',
    privacyContent: '',
    termsContent: ''
  });

  useEffect(() => {
    document.title = "Kontakt | Jakub Minka";
    const load = async () => {
      const saved = await dataStore.doc('web_settings').get();
      if (saved) setSettings(prev => ({ ...prev, ...saved }));
    };
    load();
  }, []);

  const handleOpenVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerificationOpen(true);
  };

  const handleVerificationSuccess = () => {
    setIsVerificationOpen(false);
    setFormState('loading');
    setTimeout(async () => {
      const newInquiry = { 
        id: Math.random().toString(36).substr(2, 9), 
        ...formData, 
        date: new Date().toISOString(), 
        status: 'new' 
      };
      await dataStore.collection('inquiries').save(newInquiry);
      setFormState('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setFormState('idle'), 5000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <section className="relative py-24 md:py-48 px-6 overflow-hidden bg-black text-white">
        <div className="absolute inset-0 bg-black/70 z-10"></div>
        <img src={settings.contactHeader} className="absolute inset-0 w-full h-full object-cover grayscale opacity-40" alt="" />
        <div className="relative z-20 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-8 border-white/10 shadow-2xl shrink-0"
          >
            <img src={settings.profilePic} className="w-full h-full object-cover grayscale" alt="Jakub Minka" />
          </motion.div>
          <div className="space-y-6 text-center md:text-left">
            <motion.span 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="text-[#007BFF] font-black uppercase tracking-[0.8em] text-xs"
            >
              Můj profil
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none"
            >
              Jakub <span className="font-light">Minka</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.3 }}
              className="text-xl md:text-2xl text-white/60 font-medium leading-tight max-w-2xl"
            >
              {settings.bio}
            </motion.p>
          </div>
        </div>
      </section>

      {/* Main Contact Grid */}
      <section className="max-w-7xl mx-auto px-6 py-32 grid grid-cols-1 lg:grid-cols-12 gap-24">
        {/* Left Column: Info & Details */}
        <div className="lg:col-span-5 space-y-20">
          {/* Quick Contacts */}
          <div className="space-y-10">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400">Přímý kontakt</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 bg-gray-50 text-[#007BFF] rounded-full flex items-center justify-center group-hover:bg-[#007BFF] group-hover:text-white transition-all shadow-sm">
                  <Phone size={22} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Zavolejte mi</p>
                  <p className="text-xl font-black tracking-widest text-black">{settings.phone}</p>
                </div>
              </div>
              <a href={`mailto:${settings.email}`} className="flex items-center gap-6 group">
                <div className="w-14 h-14 bg-gray-50 text-[#007BFF] rounded-full flex items-center justify-center group-hover:bg-[#007BFF] group-hover:text-white transition-all shadow-sm">
                  <Mail size={22} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Napište mi</p>
                  <p className="text-xl font-black tracking-widest text-black">{settings.email}</p>
                </div>
              </a>
              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 bg-gray-50 text-[#007BFF] rounded-full flex items-center justify-center group-hover:bg-[#007BFF] group-hover:text-white transition-all shadow-sm">
                  <MapPin size={22} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Kde působím</p>
                  <p className="text-xl font-black tracking-widest text-black">{settings.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="space-y-10 pt-16 border-t border-gray-100">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-3">
              <Building2 size={16} /> Obchodní údaje
            </h3>
            <div className="grid grid-cols-2 gap-10">
              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase text-gray-400">IČO</span>
                <p className="text-lg font-black text-black">{settings.ico}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase text-gray-400">DIČ</span>
                <p className="text-lg font-black text-black">{settings.dic || 'Nejsem plátce DPH'}</p>
              </div>
            </div>
          </div>

          {/* Socials Grid */}
          <div className="space-y-10 pt-16 border-t border-gray-100">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400">Sociální sítě</h3>
            <div className="grid grid-cols-2 gap-4">
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 bg-gray-50 hover:bg-[#E1306C] hover:text-white transition-all group">
                <div className="flex items-center gap-4"><Instagram size={20}/><span className="text-[10px] font-black uppercase">Instagram</span></div>
                <ArrowUpRight size={16} />
              </a>
              <a href={settings.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 bg-gray-50 hover:bg-[#0077B5] hover:text-white transition-all group">
                <div className="flex items-center gap-4"><Linkedin size={20}/><span className="text-[10px] font-black uppercase">LinkedIn</span></div>
                <ArrowUpRight size={16} />
              </a>
              <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 bg-gray-50 hover:bg-[#1877F2] hover:text-white transition-all group">
                <div className="flex items-center gap-4"><Facebook size={20}/><span className="text-[10px] font-black uppercase">Facebook</span></div>
                <ArrowUpRight size={16} />
              </a>
              <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 bg-gray-50 hover:bg-[#FF0000] hover:text-white transition-all group">
                <div className="flex items-center gap-4"><Youtube size={20}/><span className="text-[10px] font-black uppercase">YouTube</span></div>
                <ArrowUpRight size={16} />
              </a>
            </div>
          </div>

          {/* Legal Links */}
          <div className="space-y-8 pt-16 border-t border-gray-100">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400">Dokumentace</h3>
            <div className="flex flex-col gap-4">
              <Link to="/ochrana-soukromi" className="flex items-center gap-3 text-[11px] font-black uppercase text-black hover:text-[#007BFF] transition-colors">
                <Shield size={16} /> Ochrana osobních údajů (GDPR)
              </Link>
              <Link to="/podminky-spoluprace" className="flex items-center gap-3 text-[11px] font-black uppercase text-black hover:text-[#007BFF] transition-colors">
                <FileText size={16} /> Obchodní podmínky
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Inquiry Form */}
        <div className="lg:col-span-7">
          <div className="bg-white p-10 lg:p-20 shadow-2xl border border-gray-100 relative overflow-hidden rounded-sm">
            <div className="absolute top-0 right-0 w-3 h-full bg-[#007BFF]"></div>
            <h3 className="text-4xl font-black uppercase tracking-tighter mb-16 text-black">Poptat <span className="text-[#007BFF]">projekt</span></h3>
            
            {formState === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="py-20 text-center space-y-8"
              >
                <div className="flex justify-center text-green-500"><CheckCircle2 size={80} className="animate-bounce" /></div>
                <h4 className="text-3xl font-black uppercase tracking-widest text-black">Zpráva odeslána!</h4>
                <p className="text-gray-500 font-medium text-lg">Děkuji za zájem. Ozvu se vám zpravidla do 24 hodin.</p>
                <button onClick={() => setFormState('idle')} className="text-[#007BFF] font-black uppercase tracking-[0.4em] text-[10px] pt-12 underline decoration-2 underline-offset-8">Poslat další zprávu</button>
              </motion.div>
            ) : (
              <form className="space-y-12" onSubmit={handleOpenVerification}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Vaše jméno</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border-b-2 border-gray-100 py-5 px-4 focus:outline-none focus:border-[#007BFF] transition-colors text-base font-bold text-black" placeholder="Jan Novák" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Emailová adresa</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 border-b-2 border-gray-100 py-5 px-4 focus:outline-none focus:border-[#007BFF] transition-colors text-base font-bold text-black" placeholder="email@priklad.cz" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">O co máte zájem?</label>
                  <input type="text" required placeholder="Např. Focení hotelu v Praze" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full bg-gray-50 border-b-2 border-gray-100 py-5 px-4 focus:outline-none focus:border-[#007BFF] transition-colors text-base font-bold text-black" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Vaše zpráva</label>
                  <textarea rows={6} required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full bg-gray-50 border-b-2 border-gray-100 py-5 px-4 focus:outline-none focus:border-[#007BFF] transition-colors resize-none text-base font-medium text-black" placeholder="Zadejte detaily vašeho projektu..."></textarea>
                </div>
                
                <button disabled={formState === 'loading'} className="w-full py-6 bg-black text-white text-[11px] font-black uppercase tracking-[0.5em] flex items-center justify-center gap-4 transition-all shadow-2xl hover:bg-[#007BFF] disabled:bg-gray-100">
                  {formState === 'loading' ? <RefreshCw className="animate-spin" size={20} /> : (<>Odeslat poptávku <Send size={20} /></>)}
                </button>
                
                <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-3">
                  <Shield size={12} /> 
                  <Link to="/ochrana-soukromi" className="hover:text-black underline underline-offset-4">Odesláním souhlasíte se zpracováním osobních údajů.</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Backstage Photos Section */}
      {settings.backstage?.length > 0 && (
        <section className="py-40 bg-gray-950 text-white overflow-hidden relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[#007BFF] opacity-[0.03] blur-[150px] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-6 mb-24 text-center">
             <span className="text-[#007BFF] font-black text-xs uppercase tracking-[0.8em] block mb-6">Behind the scenes</span>
             <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none">JAK PRACUJI?</h2>
             <p className="text-gray-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-6 italic">Pohled za oponu mé produkce</p>
          </div>
          <div className="w-full flex flex-wrap">
            {settings.backstage.map((url, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 30 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="w-full sm:w-1/2 lg:w-1/4 aspect-square relative group overflow-hidden border border-white/5"
              >
                <img src={url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-[2s] group-hover:scale-110" alt={`Backstage ${i}`} />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/0 transition-all"></div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <HumanVerificationModal isOpen={isVerificationOpen} onClose={() => setIsVerificationOpen(false)} onSuccess={handleVerificationSuccess} />
    </div>
  );
};

export default Contact;
