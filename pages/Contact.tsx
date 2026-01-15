
import React, { useState, useEffect } from 'react';
import { 
  Mail, Phone, MapPin, Instagram, Facebook, Youtube, Linkedin, 
  Briefcase, Info, ArrowUpRight, Camera, Send, CheckCircle2, 
  Shield, RefreshCw, Settings, Layout, Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { WebSettings } from '../types';
import Logo from '../components/Logo';
import HumanVerificationModal from '../components/HumanVerificationModal';

const Contact: React.FC = () => {
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  
  // Fix: Initializing settings with all required WebSettings properties to fix TypeScript error.
  const [settings, setSettings] = useState<WebSettings>({
    contactHeader: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&q=80&w=2000',
    blogHeader: '',
    profilePic: 'https://picsum.photos/id/64/800/800',
    bio: 'Jsem profesionální tvůrce vizuálního obsahu s vášní pro preciznost a detail.',
    ico: '12345678',
    dic: 'CZ12345678',
    address: 'Praha, Česká republika',
    phone: '+420 777 888 999',
    email: 'info@minkastudio.cz',
    backstage: [] as string[],
    portfolioHeader: '',
    specializationHeaders: {},
    homeAboutTitle: '',
    homeAboutText: '',
    footerDescription: 'Profesionální vizuální storytelling pro firmy, architekturu a průmysl.',
    doc1Name: 'Ochrana soukromí',
    doc1Url: '/ochrana-soukromi',
    doc2Name: 'Podmínky spolupráce',
    doc2Url: '#',
    instagramUrl: '#',
    facebookUrl: '#',
    youtubeUrl: '#',
    linkedinUrl: '#',
    // Missing properties that are required by WebSettings interface
    pricingTitle: 'Cena není fixní',
    pricingSubtitle: 'Investice do vizuálu',
    price1Title: 'Malé zakázky',
    price1Value: 'nižší tisíce Kč',
    price1Desc: 'Rychlé focení na sítě, menší interiéry nebo portréty.',
    price2Title: 'Velké produkce',
    price2Value: 'desítky tisíc Kč',
    price2Desc: 'Celodenní video produkce, kampaně a developerské projekty.',
    pricingCta: 'Cenovou nabídku připravím na míru vašemu projektu →'
  });

  useEffect(() => {
    document.title = "Kontakt | Jakub Minka - Fotograf a kameraman";
    const saved = localStorage.getItem('jakub_minka_web_settings');
    if (saved) {
      setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
    }
  }, []);

  const handleOpenVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerificationOpen(true);
  };

  const handleVerificationSuccess = () => {
    setIsVerificationOpen(false);
    setFormState('loading');
    setTimeout(() => {
      const newInquiry = { id: Math.random().toString(36).substr(2, 9), ...formData, date: new Date().toISOString(), status: 'new' };
      const saved = localStorage.getItem('jakub_minka_inquiries');
      const inquiries = saved ? JSON.parse(saved) : [];
      localStorage.setItem('jakub_minka_inquiries', JSON.stringify([newInquiry, ...inquiries]));
      window.dispatchEvent(new Event('storage'));
      setFormState('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setFormState('idle'), 5000);
    }, 1500);
  };

  const triggerCookieSettings = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new Event('reopen-cookie-settings'));
  };

  // Komponenta pro horizontální logo specializovaného webu
  const SpecializedBrand: React.FC<{ 
    name: string, 
    suffix: string, 
    tagline: string, 
    url: string,
    accentColor: string
  }> = ({ name, suffix, tagline, url, accentColor }) => (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 group p-10 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 transition-all shadow-sm hover:shadow-2xl">
      {/* Col 1: Icon Square */}
      <div className="w-14 h-14 bg-black flex items-center justify-center transition-transform duration-700 group-hover:scale-110 shrink-0">
        <span className="font-syne text-white text-3xl font-bold tracking-tighter">M</span>
      </div>

      {/* Col 2: Brand text + Tagline */}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className="font-syne text-[28px] font-light uppercase tracking-tight text-gray-950 leading-none">{name}</span>
          <span className="font-syne text-[11px] font-extralight uppercase tracking-[0.4em] transition-colors duration-500" style={{ color: accentColor }}>
            {suffix}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-[9px] text-gray-400 font-black uppercase tracking-[0.4em] leading-none block">{tagline}</span>
          <ArrowUpRight size={12} className="text-gray-300 group-hover:text-[#007BFF] transition-colors" />
        </div>
      </div>
    </a>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Intro Section */}
      <section className="relative py-24 md:py-48 px-6 overflow-hidden bg-black text-white">
        <div className="absolute inset-0 bg-black/60_z-10"></div>
        <img src={settings.contactHeader} className="absolute inset-0 w-full h-full object-cover grayscale opacity-50" alt="Contact Banner" />
        
        <div className="relative z-20 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-8 border-white/10 shadow-2xl shrink-0">
            <img src={settings.profilePic} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="Jakub Minka" />
          </div>
          <div className="space-y-6 text-center md:text-left">
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#007BFF] font-black uppercase tracking-[0.8em] text-xs">Můj profil</motion.span>
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none">Jakub <span className="font-light">Minka</span></h1>
            <p className="text-xl md:text-2xl text-white/60 font-medium leading-tight max-w-2xl">{settings.bio}</p>
          </div>
        </div>
      </section>

      {/* Main Info Cards */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-gray-50">
        <div className="text-center p-12 bg-white border border-gray-100 group hover:border-[#007BFF] transition-all">
          <div className="w-16 h-16 bg-gray-50 text-[#007BFF] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#007BFF] group-hover:text-white transition-colors shadow-sm">
            <Phone size={24} />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Telefon</h3>
          <p className="text-xl font-black tracking-widest text-black">{settings.phone}</p>
        </div>

        <a href={`mailto:${settings.email}`} className="text-center p-12 bg-white border border-gray-100 group hover:border-[#007BFF] transition-all">
          <div className="w-16 h-16 bg-gray-50 text-[#007BFF] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#007BFF] group-hover:text-white transition-colors shadow-sm">
            <Mail size={24} />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">E-mail</h3>
          <p className="text-xl font-black tracking-widest break-all text-black">{settings.email}</p>
        </a>

        <div className="text-center p-12 bg-white border border-gray-100 group hover:border-[#007BFF] transition-all">
          <div className="w-16 h-16 bg-gray-50 text-[#007BFF] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#007BFF] group-hover:text-white transition-colors shadow-sm">
            <MapPin size={24} />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Působiště</h3>
          <p className="text-xl font-black tracking-widest text-black">Celá ČR / EU</p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact-form-anchor" className="py-24 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white p-10 lg:p-20 shadow-2xl rounded-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-[#007BFF]"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-4 space-y-8">
                <h3 className="text-3xl font-black uppercase tracking-tighter text-black leading-none">Poptat <span className="text-[#007BFF]">projekt</span></h3>
                <p className="text-gray-500 font-medium leading-relaxed">
                  Máte konkrétní představu nebo potřebujete poradit s vizuálním stylem? Napište mi a společně vymyslíme nejlepší řešení.
                </p>
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <CheckCircle2 size={16} className="text-[#007BFF]" /> Odpověď do 24 hodin
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <CheckCircle2 size={16} className="text-[#007BFF]" /> Konzultace zdarma
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8">
                {formState === 'success' ? (
                  <div className="py-12 text-center space-y-6">
                    <div className="flex justify-center text-green-500 mb-6"><CheckCircle2 size={64} className="animate-bounce" /></div>
                    <h4 className="text-2xl font-black uppercase tracking-widest text-black">Zpráva odeslána!</h4>
                    <p className="text-gray-500 font-medium">Ozvu se vám co nejdříve s návrhem řešení.</p>
                    <button onClick={() => setFormState('idle')} className="text-[#007BFF] font-black uppercase tracking-widest text-[10px] pt-10 underline decoration-2 underline-offset-8">Odeslat další zprávu</button>
                  </div>
                ) : (
                  <form className="space-y-8" onSubmit={handleOpenVerification}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Jméno a Příjmení</label>
                        <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-100 py-4 px-2 focus:outline-none focus:border-[#007BFF] transition-colors text-sm font-bold text-black" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Emailová adresa</label>
                        <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 border border-gray-100 py-4 px-2 focus:outline-none focus:border-[#007BFF] transition-colors text-sm font-bold text-black" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Předmět / O co máte zájem?</label>
                      <input type="text" required placeholder="Např. Focení hotelu, firemní video..." value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full bg-gray-50 border border-gray-100 py-4 px-2 focus:outline-none focus:border-[#007BFF] transition-colors text-sm font-bold text-black" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Vaše zpráva</label>
                      <textarea rows={4} required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full bg-gray-50 border border-gray-100 py-4 px-2 focus:outline-none focus:border-[#007BFF] transition-colors resize-none text-sm font-medium text-black"></textarea>
                    </div>
                    <button disabled={formState === 'loading'} className="w-full py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all shadow-xl hover:bg-[#007BFF] disabled:bg-gray-100 disabled:text-gray-400">
                      {formState === 'loading' ? <RefreshCw className="animate-spin" size={18} /> : (<>Odeslat poptávku <Send size={18} /></>)}
                    </button>
                    <p className="text-center text-[8px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                      <Shield size={10} /> 
                      <Link to="/ochrana-soukromi" className="hover:text-black underline underline-offset-2">Odesláním souhlasíte se zpracováním osobních údajů.</Link>
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialized Websites - HORIZONTAL LOGO STYLE */}
      <section className="py-24 bg-white border-b border-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <span className="text-[#007BFF] font-black text-[9px] uppercase tracking-[0.6em] block mb-2">Moje další projekty</span>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-black">Specializované weby</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <SpecializedBrand 
              name="Minka" 
              suffix="Weddings" 
              tagline="svatební kameraman" 
              url="https://www.jakubminka.cz" 
              accentColor="#A3937B" // Khaki
            />
            <SpecializedBrand 
              name="Minka" 
              suffix="Aerials" 
              tagline="fotografie a video dronem" 
              url="https://www.fotovideodronem.cz" 
              accentColor="#00B2FF" // Blankytná modrá
            />
          </div>
        </div>
      </section>

      {/* Business Info & Socials */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div className="space-y-12">
          <h3 className="text-sm font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-3"><Briefcase size={16} /> Obchodní údaje</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">IČO</span>
              <p className="text-lg font-bold text-black">{settings.ico}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">DIČ</span>
              <p className="text-lg font-bold text-black">{settings.dic}</p>
            </div>
            <div className="col-span-full space-y-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Adresa</span>
              <p className="text-lg font-bold text-black">{settings.address}</p>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          <h3 className="text-sm font-black uppercase tracking-[0.4em] text-gray-400">Sledujte mou tvorbu</h3>
          <div className="grid grid-cols-2 gap-6">
            <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 bg-gray-50 hover:bg-[#E1306C] hover:text-white transition-all group">
              <div className="flex items-center gap-4">
                <Instagram size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Instagram</span>
              </div>
              <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a href={settings.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 bg-gray-50 hover:bg-[#0077B5] hover:text-white transition-all group">
              <div className="flex items-center gap-4">
                <Linkedin size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">LinkedIn</span>
              </div>
              <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 bg-gray-50 hover:bg-[#1877F2] hover:text-white transition-all group">
              <div className="flex items-center gap-4">
                <Facebook size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Facebook</span>
              </div>
              <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 bg-gray-50 hover:bg-[#FF0000] hover:text-white transition-all group">
              <div className="flex items-center gap-4">
                <Youtube size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">YouTube</span>
              </div>
              <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      </section>

      {/* BTS Gallery Section */}
      {settings.backstage && settings.backstage.length > 0 && (
        <section className="py-32 bg-gray-950 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#007BFF] opacity-10 blur-[120px]"></div>
          <div className="max-w-7xl mx-auto px-6 mb-20 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-8">
             <div className="space-y-4">
               <span className="text-[#007BFF] font-black text-xs uppercase tracking-[0.7em] block">Produkční deník</span>
               <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none">JAK PRACUJI? <br /><span className="text-[#007BFF]">BEHIND THE SCENES</span></h2>
             </div>
             <p className="text-white/40 max-w-sm text-sm font-medium leading-relaxed">
               Pohled za oponu mých projektů. Od technického vybavení po atmosféru na place.
             </p>
          </div>
          
          <div className="w-full flex flex-wrap">
            {settings.backstage.map((url, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0 }} 
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="w-full md:w-1/3 lg:w-1/4 aspect-square relative group overflow-hidden border border-white/5"
              >
                <img src={url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-[1.5s]" alt="Jak pracuji - BTS" />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/0 transition-all"></div>
                <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                   <div className="bg-[#007BFF] p-3 shadow-2xl">
                      <ImageIcon size={20} className="text-white" />
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Final Page Mini-Footer */}
      <footer className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center space-y-12">
           <Logo />
           <p className="text-gray-500 max-w-sm leading-relaxed text-sm font-medium">
             {settings.footerDescription}
           </p>
           
           <div className="flex flex-wrap items-center justify-center gap-12 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
             <p>© {new Date().getFullYear()} MINKA Studio. Všechna práva vyzena.</p>
             <div className="flex gap-8">
               <button onClick={triggerCookieSettings} className="hover:text-[#007BFF] transition-colors flex items-center gap-2">
                 <Settings size={12} /> Nastavení soukromí
               </button>
               <Link to="/ochrana-soukromi" className="hover:text-[#007BFF] transition-colors">Ochrana soukromí</Link>
               <a href={settings.doc2Url} target="_blank" rel="noopener noreferrer" className="hover:text-[#007BFF] transition-colors">{settings.doc2Name}</a>
             </div>
           </div>
        </div>
      </footer>

      <HumanVerificationModal isOpen={isVerificationOpen} onClose={() => setIsVerificationOpen(false)} onSuccess={handleVerificationSuccess} />
    </div>
  );
};

export default Contact;
