
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Wallet, Zap, Info, ArrowUpRight, MessageSquare, ExternalLink, Star, Quote } from 'lucide-react';
import { PROJECTS as DEFAULT_PROJECTS, SPECIALIZATIONS, REVIEWS as DEFAULT_REVIEWS } from '../constants';
import { Project, WebSettings, Review } from '../types';
import { Link } from 'react-router-dom';
import MasonryGrid from '../components/MasonryGrid';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';

const Home: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [partners, setPartners] = useState<{id: string, name: string}[]>([]);
  const [reviews, setReviews] = useState<Review[]>(DEFAULT_REVIEWS);
  const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);
  const [settings, setSettings] = useState<WebSettings>({
    homeAboutTitle: 'Vizuální příběhy, které prodávají',
    homeAboutText: 'Jsem fotograf a kameraman se zaměřením na komerční tvorbu, architekturu a průmysl. Mým cílem je zachytit podstatu vašeho projektu tak, aby oslovila ty správné lidi.',
    profilePic: 'https://picsum.photos/id/64/800/800',
    pricingTitle: 'Investice do vizuálu',
    pricingSubtitle: 'Cena není fixní',
    price1Title: 'Menší produkce',
    price1Value: 'od 5.000 Kč',
    price1Desc: 'Rychlé focení na sítě, menší interiéry, portréty...',
    price2Title: 'Větší kampaň',
    price2Value: 'od 15.000 Kč',
    price2Desc: 'Celodenní produkce, reklamní video, dron...',
    contactHeader: '', blogHeader: '', portfolioHeader: '', specializationHeaders: {}, bio: '', ico: '', dic: '', address: '', phone: '', email: '', footerDescription: '', doc1Name: '', doc1Url: '', doc2Name: '', doc2Url: '', backstage: [], instagramUrl: '', facebookUrl: '', youtubeUrl: '', linkedinUrl: '', pricingCta: 'Poptat projekt →'
  });
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cursorX = useSpring(mouseX, { damping: 30, stiffness: 250 });
  const cursorY = useSpring(mouseY, { damping: 30, stiffness: 250 });

  useEffect(() => {
    const savedProjects = localStorage.getItem('jakub_minka_projects');
    if (savedProjects) setProjects(JSON.parse(savedProjects));
    
    const savedSettings = localStorage.getItem('jakub_minka_web_settings');
    if (savedSettings) setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));

    const savedPartners = localStorage.getItem('jakub_minka_partners');
    if (savedPartners) setPartners(JSON.parse(savedPartners));

    const savedReviews = localStorage.getItem('jakub_minka_reviews');
    if (savedReviews) setReviews(JSON.parse(savedReviews));
  }, []);

  const homePortfolioProjects = useMemo(() => {
    return [...projects].sort(() => Math.random() - 0.5).slice(0, 12);
  }, [projects]);

  const heroProjects = useMemo(() => projects.slice(0, 5), [projects]);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
    const width = window.innerWidth;
    if (e.clientX < width * 0.15) setHoverSide('left');
    else if (e.clientX > width * 0.85) setHoverSide('right');
    else setHoverSide(null);
  };

  const handleNext = () => setCurrentSlide((prev) => (prev + 1) % heroProjects.length);
  const handlePrev = () => setCurrentSlide((prev) => (prev - 1 + heroProjects.length) % heroProjects.length);

  useEffect(() => {
    if (heroProjects.length === 0) return;
    const timer = setInterval(handleNext, 6000);
    return () => clearInterval(timer);
  }, [heroProjects.length]);

  const activeProject = heroProjects[currentSlide];

  // Příprava log pro nekonečný loop (zprava doleva)
  const partnerList = partners.length > 0 ? partners : [
    {id: '1', name: 'Skoda Auto'}, {id: '2', name: 'Red Bull'}, {id: '3', name: 'STRABAG'}, 
    {id: '4', name: 'Metrostav'}, {id: '5', name: 'Volvo'}, {id: '6', name: 'Siemens'},
    {id: '7', name: 'Cemex'}, {id: '8', name: 'Eurovia'}, {id: '9', name: 'Penta Real Estate'}
  ];

  return (
    <div className="w-full overflow-hidden bg-white">
      {/* 1. HERO SECTION WITH INDICATORS */}
      <section 
        className={`relative h-[90vh] w-full overflow-hidden bg-black text-white ${hoverSide ? 'cursor-none' : 'cursor-default'}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverSide(null)}
      >
        <AnimatePresence>
          {hoverSide && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ left: cursorX, top: cursorY }} className="fixed z-50 pointer-events-none flex flex-col items-center gap-3 -translate-x-1/2 -translate-y-1/2">
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
                {hoverSide === 'left' ? <ArrowLeft size={24} /> : <ArrowRight size={24} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="absolute inset-y-0 left-0 w-[15%] z-30 cursor-none" onClick={handlePrev}></div>
        <div className="absolute inset-y-0 right-0 w-[15%] z-30 cursor-none" onClick={handleNext}></div>

        <div className="absolute inset-0 z-0 h-full w-full">
          {heroProjects.map((project, idx) => (
            <div key={`bg-${project.id}`} className={`absolute inset-0 h-full w-full transition-opacity duration-[1500ms] ease-in-out ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute inset-0 bg-black/50 z-10"></div>
              <img src={project.thumbnailUrl} alt="" className="w-full h-full object-cover scale-105" />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div key={currentSlide} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.8 }} className="flex flex-col items-center">
              <span className="bg-[#007BFF] text-white font-black text-[9px] uppercase tracking-[0.5em] px-6 py-2.5 mb-8 shadow-xl">{activeProject?.category}</span>
              <h1 className="text-5xl md:text-8xl lg:text-[140px] font-black mb-14 tracking-tighter leading-[0.8] uppercase drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">{activeProject?.title}</h1>
              <Link to={`/projekt/${activeProject?.id}`} className="pointer-events-auto border-2 border-white/60 px-14 py-5 text-[11px] font-black uppercase tracking-[0.6em] hover:bg-white hover:text-black transition-all bg-black/20 backdrop-blur-md">PROHLÉDNOUT</Link>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* SLIDE INDICATORS (Tečky) */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 flex gap-4">
          {heroProjects.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setCurrentSlide(i)}
              className={`h-2 transition-all duration-500 rounded-full ${currentSlide === i ? 'w-16 bg-[#007BFF]' : 'w-2 bg-white/20 hover:bg-white/40'}`}
              aria-label={`Přejít na slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 2. O MNĚ SECTION */}
      <section className="py-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="relative group">
            <div className="absolute -top-6 -left-6 w-32 h-32 border-l-4 border-t-4 border-[#007BFF] -z-10 group-hover:scale-110 transition-transform"></div>
            <img src={settings.profilePic} className="w-full aspect-[4/5] object-cover grayscale hover:grayscale-0 transition-all duration-1000 shadow-2xl" alt="Jakub Minka" />
            <div className="absolute -bottom-8 -right-8 bg-black text-white p-10 hidden md:block">
              <p className="text-4xl font-black tracking-tighter uppercase leading-none">12+ LET</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#007BFF] mt-2">ZKUŠENOSTÍ V OBORU</p>
            </div>
          </div>
          <div className="space-y-10">
            <div className="space-y-4">
              <span className="text-[#007BFF] font-black text-xs uppercase tracking-[0.6em] block">O mně</span>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] uppercase text-black">{settings.homeAboutTitle}</h2>
            </div>
            <div className="prose prose-xl text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">
              {settings.homeAboutText}
            </div>
            <div className="pt-6">
              <Link to="/kontakt" className="inline-flex items-center gap-4 text-black text-[12px] font-black uppercase tracking-[0.4em] group border-b-4 border-black pb-2 hover:text-[#007BFF] hover:border-[#007BFF] transition-all">
                VÍCE O MÉ PRÁCI <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SPOLUPRACOVAL JSEM SECTION (INFINITE LOOP - ZPRAVA DOLEVA) */}
      <section className="py-24 bg-gray-50 border-y border-gray-100 overflow-hidden relative">
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            display: flex;
            width: fit-content;
            animation: marquee 30s linear infinite;
          }
        `}</style>
        <div className="max-w-7xl mx-auto px-6 mb-12 relative z-10">
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 italic">Důvěřují mému vizuálnímu rukopisu</h3>
        </div>
        <div className="flex whitespace-nowrap">
           <div className="animate-marquee flex items-center gap-24">
              {[...partnerList, ...partnerList].map((p, idx) => (
                <span key={`${p.id}-${idx}`} className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-black/20 hover:text-[#007BFF] transition-colors cursor-default">
                  {p.name}
                </span>
              ))}
           </div>
        </div>
      </section>

      {/* 4. SPECIALIZACE SECTION (2x5 GRID) */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 mb-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
             <div className="space-y-4">
               <span className="text-[#007BFF] font-black text-xs uppercase tracking-[0.7em] block">Komplexní služby</span>
               <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none text-black uppercase">Specializace</h2>
             </div>
             <p className="text-gray-400 max-w-sm text-sm font-medium leading-relaxed">
               Deset klíčových oblastí včetně dronů a svateb, ve kterých dodávám špičkový vizuální obsah.
             </p>
          </div>
        </div>
        <div className="max-w-full grid grid-cols-2 md:grid-cols-5 bg-black">
           {SPECIALIZATIONS.map(spec => {
             const Content = (
                <>
                  <img src={spec.image} className="w-full h-full object-cover opacity-40 grayscale group-hover:scale-110 group-hover:opacity-70 transition-all duration-1000" />
                  <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end">
                     <h4 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter group-hover:text-[#007BFF] transition-colors leading-tight">{spec.name}</h4>
                     <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mt-2 group-hover:text-white transition-colors">
                       {spec.externalUrl ? 'Navštívit web' : 'Zobrazit portfolio'}
                     </p>
                  </div>
                  <div className="absolute top-6 right-6 text-white/20 group-hover:text-[#007BFF] transition-colors">
                    {spec.externalUrl ? <ExternalLink size={24} /> : <ArrowUpRight size={24} />}
                  </div>
                </>
             );

             return spec.externalUrl ? (
               <a key={spec.id} href={spec.externalUrl} target="_blank" rel="noopener noreferrer" className="group relative aspect-square overflow-hidden bg-black border border-white/5">
                 {Content}
               </a>
             ) : (
               <Link key={spec.id} to={`/specializace/${spec.id}`} className="group relative aspect-square overflow-hidden bg-black border border-white/5">
                 {Content}
               </Link>
             );
           })}
        </div>
      </section>

      {/* 5. PORTFOLIO SECTION */}
      <section className="py-32 bg-black">
        <div className="max-w-7xl mx-auto px-6 mb-20 text-center">
          <span className="text-[#007BFF] font-black text-xs uppercase tracking-[0.7em] block mb-6">Práce, za kterou si stojím</span>
          <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-none text-white uppercase">Portfolio</h2>
        </div>
        <MasonryGrid projects={homePortfolioProjects} showSpecialization={true} />
        <div className="mt-24 flex justify-center">
          <Link to="/portfolio" className="bg-[#007BFF] text-white px-20 py-5 text-[11px] font-black uppercase tracking-[0.5em] hover:bg-white hover:text-black transition-all shadow-2xl">VŠECHNY PROJEKTY</Link>
        </div>
      </section>

      {/* 6. CENÍK SECTION */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#007BFF] opacity-5 blur-[120px]"></div>
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-24">
          <div className="lg:w-1/2 space-y-10">
            <div className="space-y-4">
              <span className="text-[#007BFF] font-black text-[11px] uppercase tracking-[0.8em] block">{settings.pricingSubtitle}</span>
              <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-none uppercase text-black">{settings.pricingTitle}</h2>
            </div>
            <p className="text-gray-500 text-lg leading-relaxed max-w-xl font-medium">Finální cena se odvíjí od rozsahu, technické náročnosti a využití výstupů (licence). Kontaktujte mě pro konkrétní nabídku.</p>
            <div className="flex items-center gap-6 p-8 bg-gray-50 border border-gray-100">
               <div className="p-4 bg-[#007BFF]/10 text-[#007BFF]"><Info size={28} /></div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rychlá poptávka</p>
                  <Link to="/kontakt" className="text-sm font-black uppercase border-b-2 border-black hover:text-[#007BFF] hover:border-[#007BFF] transition-all">Napište si o kalkulaci</Link>
               </div>
            </div>
          </div>
          <div className="lg:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            <div className="bg-white border-4 border-gray-100 p-12 space-y-8 hover:border-[#007BFF] transition-all group">
              <Wallet className="text-[#007BFF]" size={40} />
              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">{settings.price1Title}</h3>
                <p className="text-3xl font-black tracking-tighter text-black">{settings.price1Value}</p>
              </div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed line-clamp-4">{settings.price1Desc}</p>
            </div>
            <div className="bg-black p-12 space-y-8 hover:bg-[#007BFF] transition-all group shadow-2xl">
              <Zap className="text-[#007BFF] group-hover:text-white" size={40} />
              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-white/40">{settings.price2Title}</h3>
                <p className="text-3xl font-black tracking-tighter text-white">{settings.price2Value}</p>
              </div>
              <p className="text-xs text-white/50 font-bold uppercase tracking-widest leading-relaxed line-clamp-4 group-hover:text-white">{settings.price2Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA SECTION */}
      <section className="py-40 bg-gray-950 text-white relative overflow-hidden">
         <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#007BFF] rounded-full blur-[150px]"></div>
         </div>
         <div className="max-w-7xl mx-auto px-6 relative z-10 text-center space-y-12">
            <span className="text-[#007BFF] font-black text-xs uppercase tracking-[0.8em] block">Máte připravený brief?</span>
            <h2 className="text-6xl md:text-[100px] font-black uppercase tracking-tighter leading-none">POJĎME TO <br /><span className="text-[#007BFF]">ZREALIZOVAT.</span></h2>
            <div className="pt-8 flex flex-col md:flex-row items-center justify-center gap-8">
               <Link to="/kontakt" className="bg-white text-black px-16 py-6 text-[12px] font-black uppercase tracking-[0.5em] hover:bg-[#007BFF] hover:text-white transition-all shadow-2xl flex items-center gap-4">
                 POPTAT TERMÍN <MessageSquare size={18} />
               </Link>
               <Link to="/portfolio" className="border-2 border-white/20 text-white px-16 py-6 text-[12px] font-black uppercase tracking-[0.5em] hover:bg-white hover:text-black transition-all">
                 UKÁZKY PRACÍ
               </Link>
            </div>
         </div>
      </section>

      {/* 8. RECENZE SECTION (POD CTA) */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20">
            <span className="text-[#007BFF] font-black text-xs uppercase tracking-[0.7em] block mb-4">Zkušenosti klientů</span>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-black">Co o mně říkají</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.slice(0, 3).map((review) => (
              <div key={review.id} className="bg-gray-50 p-10 relative group hover:bg-black transition-all duration-500">
                <Quote className="absolute top-6 right-6 text-gray-200 group-hover:text-white/10 transition-colors" size={48} />
                <div className="flex gap-1 mb-8">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" className="text-[#007BFF]" />
                  ))}
                </div>
                <p className="text-gray-600 text-lg font-medium leading-relaxed mb-10 group-hover:text-white/80 transition-colors">
                  "{review.text}"
                </p>
                <div className="pt-8 border-t border-gray-200 group-hover:border-white/10 transition-colors">
                  <h4 className="font-black uppercase tracking-widest text-[11px] text-black group-hover:text-white">{review.author}</h4>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 block">Ověřený klient</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
