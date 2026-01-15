
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Lock, Eye, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WebSettings } from '../types';

const PrivacyPolicy: React.FC = () => {
  const [settings, setSettings] = useState<Partial<WebSettings>>({});

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Ochrana osobních údajů | Jakub Minka";
    const saved = localStorage.getItem('jakub_minka_web_settings');
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <header className="bg-gray-50 py-24 md:py-32 px-6 border-b border-gray-100">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Link to="/" className="inline-flex items-center gap-2 text-[#007BFF] text-[10px] font-black uppercase tracking-widest mb-8 hover:gap-4 transition-all">
            <ArrowLeft size={14} /> Zpět na hlavní stranu
          </Link>
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#007BFF] mx-auto shadow-sm border border-blue-100">
            <Shield size={32} />
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black">
            OCHRANA OSOBNÍCH <br /><span className="text-[#007BFF]">ÚDAJŮ</span>
          </h1>
          <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px]">Poslední aktualizace: {new Date().toLocaleDateString('cs-CZ')}</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-20">
        <div className="prose prose-lg max-w-none space-y-16 text-gray-700 font-medium leading-relaxed">
          
          <section className="space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-4">
              <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm">1</span>
              Správce údajů
            </h2>
            <div className="bg-gray-50 p-8 border border-gray-100 space-y-4">
              <p className="font-bold text-black uppercase tracking-widest text-xs">Jakub Minka (MINKA Studio)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-400 uppercase text-[9px] font-black block">IČO</span> {settings.ico || '12345678'}</div>
                <div><span className="text-gray-400 uppercase text-[9px] font-black block">Adresa</span> {settings.address || 'Praha, Česká republika'}</div>
                <div><span className="text-gray-400 uppercase text-[9px] font-black block">Email</span> {settings.email || 'info@minkastudio.cz'}</div>
                <div><span className="text-gray-400 uppercase text-[9px] font-black block">Telefon</span> {settings.phone || '+420 777 888 999'}</div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-4">
              <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm">2</span>
              Účely zpracování údajů
            </h2>
            <p>Vaše osobní údaje zpracováváme pouze v nezbytném rozsahu pro následující účely:</p>
            <ul className="space-y-4 list-none p-0">
              <li className="flex gap-4 items-start">
                <div className="mt-1 text-[#007BFF]"><Lock size={18} /></div>
                <div><strong className="text-black uppercase text-xs block mb-1">Vyřízení poptávky</strong> Údaje z kontaktního formuláře (jméno, e-mail) používáme výhradně k tomu, abychom vás kontaktovali ohledně vašich dotazů či nabídek služeb.</div>
              </li>
              <li className="flex gap-4 items-start">
                <div className="mt-1 text-[#007BFF]"><Eye size={18} /></div>
                <div><strong className="text-black uppercase text-xs block mb-1">Analytika a statistika</strong> Pomocí souborů cookies sledujeme anonymní chování návštěvníků na webu, abychom mohli zlepšovat naše služby (Google Analytics).</div>
              </li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-4">
              <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm">3</span>
              Soubory Cookies
            </h2>
            <p>
              Cookies jsou malé textové soubory, které se ukládají do vašeho prohlížeče. Na tomto webu využíváme:
            </p>
            <div className="space-y-4 text-sm">
              <p>• <strong>Nezbytné:</strong> Nutné pro správný chod webu a uložení vašich preferencí.</p>
              <p>• <strong>Analytické:</strong> Pomáhají nám pochopit, jak web používáte. Jsou anonymizované.</p>
              <p>• <strong>Marketingové:</strong> Používány pro přehrávání YouTube videí a propojení se sociálními sítěmi.</p>
            </div>
            <p className="text-sm italic">Své preference můžete kdykoliv změnit v patičce webu pod odkazem „Nastavení soukromí“.</p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-4">
              <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm">4</span>
              Vaše práva (GDPR)
            </h2>
            <p>Jako subjekt údajů máte podle nařízení GDPR následující práva:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {[
                { t: 'Právo na přístup', d: 'Máte právo vědět, jaké údaje o vás zpracováváme.' },
                { t: 'Právo na opravu', d: 'Můžete nás požádat o opravu nepřesných údajů.' },
                { t: 'Právo na výmaz', d: 'Máte právo „být zapomenut“, pokud údaje již nejsou potřeba.' },
                { t: 'Právo vznést námitku', d: 'Můžete namítat proti zpracování pro účely marketingu.' }
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 p-6 border border-gray-100">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-black mb-2">{item.t}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.d}</p>
                </div>
              ))}
            </div>
            <p className="pt-8 border-t border-gray-100 text-sm">
              Pro uplatnění svých práv nás kontaktujte na e-mailu: <span className="text-[#007BFF] font-bold">{settings.email || 'info@minkastudio.cz'}</span>. 
              V případě nespokojenosti máte právo podat stížnost u Úřadu pro ochranu osobních údajů (www.uoou.cz).
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
