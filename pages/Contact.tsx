
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
import { dataStore } from '../lib/db';

const Contact: React.FC = () => {
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  
  const [settings, setSettings] = useState<WebSettings>({
    contactHeader: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&q=80&w=2000',
    blogHeader: '',
    profilePic: 'https://picsum.photos/id/64/800/800',
    bio: 'Jsem profesionální tvůrce vizuálního obsahu s vášní pro preciznost a detail.',
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
    doc2Url: '#',
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
    pricingCta: ''
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
      const newInquiry = { id: Math.random().toString(36).substr(2, 9), ...formData, date: new Date().toISOString(), status: 'new' };
      await dataStore.collection('inquiries').save(newInquiry);
      setFormState('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setFormState('idle'), 5000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="relative py-24 md:py-48 px-6 overflow-hidden bg-black text-white">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <img src={settings.contactHeader} className="absolute inset-0 w-full h-full object-cover grayscale opacity-50" alt="" />
        <div className="relative z-20 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-8 border-white/10 shadow-2xl shrink-0">
            <img src={settings.profilePic} className="w-full h-full object-cover grayscale" alt="" />
          </div>
          <div className="space-y-6 text-center md:text-left">
            <span className="text-[#007BFF] font-black uppercase tracking-[0.8em] text-xs">Můj profil</span>
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none">Jakub <span className="font-light">Minka</span></h1>
            <p className="text-xl md:text-2xl text-white/60 font-medium leading-tight max-w-2xl">{settings.bio}</p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-gray-50">
        <div className="text-center p-12 bg-white border border-gray-100 group hover:border-[#007BFF] transition-all">
          <div className="w-16 h-16 bg-gray-50 text-[#007BFF] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#007BFF] group-hover:text-white transition-colors"><Phone size={24} /></div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Telefon</h3>
          <p className="text-xl font-black tracking-widest text-black">{settings.phone}</p>
        </div>
        <a href={`mailto:${settings.email}`} className="text-center p-12 bg-white border border-gray-100 group hover:border-[#007BFF] transition-all">
          <div className="w-16 h-16 bg-gray-50 text-[#007BFF] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#007BFF] group-hover:text-white transition-colors"><Mail size={24} /></div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">E-mail</h3>
          <p className="text-xl font-black tracking-widest text-black">{settings.email}</p>
        </a>
        <div className="text-center p-12 bg-white border border-gray-100 group hover:border-[#007BFF] transition-all">
          <div className="w-16 h-16 bg-gray-50 text-[#007BFF] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#007BFF] group-hover:text-white transition-colors"><MapPin size={24} /></div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Působiště</h3>
          <p className="text-xl font-black tracking-widest text-black">Celá ČR / EU</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div className="space-y-12">
          <h3 className="text-sm font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-3"><Briefcase size={16} /> Obchodní údaje</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1"><span className="text-[8px] font-black uppercase text-gray-400">IČO</span><p className="text-lg font-bold text-black">{settings.ico}</p></div>
            <div className="space-y-1"><span className="text-[8px] font-black uppercase text-gray-400">DIČ</span><p className="text-lg font-bold text-black">{settings.dic}</p></div>
            <div className="col-span-full space-y-1"><span className="text-[8px] font-black uppercase text-gray-400">Adresa</span><p className="text-lg font-bold text-black">{settings.address}</p></div>
          </div>
        </div>
        <div className="space-y-12">
          <h3 className="text-sm font-black uppercase tracking-[0.4em] text-gray-400">Sledujte mě</h3>
          <div className="grid grid-cols-2 gap-6">
            <a href={settings.instagramUrl} className="flex items-center justify-between p-6 bg-gray-50 hover:bg-[#E1306C] hover:text-white transition-all group">
              <div className="flex items-center gap-4"><Instagram size={20}/><span className="text-[10px] font-black uppercase">Instagram</span></div>
              <ArrowUpRight size={16} />
            </a>
            <a href={settings.linkedinUrl} className="flex items-center justify-between p-6 bg-gray-50 hover:bg-[#0077B5] hover:text-white transition-all group">
              <div className="flex items-center gap-4"><Linkedin size={20}/><span className="text-[10px] font-black uppercase">LinkedIn</span></div>
              <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {settings.backstage?.length > 0 && (
        <section className="py-32 bg-gray-950 text-white overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-6 mb-20 text-center md:text-left">
             <span className="text-[#007BFF] font-black text-xs uppercase tracking-[0.7em] block mb-4">Behind the scenes</span>
             <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none">JAK PRACUJI?</h2>
          </div>
          <div className="w-full flex flex-wrap">
            {settings.backstage.map((url, i) => (
              <div key={i} className="w-full md:w-1/3 lg:w-1/4 aspect-square relative group overflow-hidden border border-white/5">
                <img src={url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-[1.5s]" alt="" />
              </div>
            ))}
          </div>
        </section>
      )}

      <HumanVerificationModal isOpen={isVerificationOpen} onClose={() => setIsVerificationOpen(false)} onSuccess={handleVerificationSuccess} />
    </div>
  );
};

export default Contact;
