
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Project, MediaType, GalleryItem } from '../types';
import { PROJECTS as DEFAULT_PROJECTS } from '../constants';
import { projectDB } from '../lib/db';
import { 
  ArrowLeft, ChevronRight, ChevronLeft, Play, PackageCheck, X, Maximize2, Camera, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const load = async () => {
      const dbProjects = await projectDB.getAll();
      const allProjects = dbProjects && dbProjects.length > 0 ? dbProjects : DEFAULT_PROJECTS;
      const found = allProjects.find(p => p.id === id);
      if (found) {
        setProject(found);
        document.title = `${found.title} | Jakub Minka`;
      } else {
        navigate('/portfolio');
      }
    };
    load();
  }, [id, navigate]);

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (activeLightboxIndex === null || !project?.gallery) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveLightboxIndex(activeLightboxIndex === 0 ? project.gallery!.length - 1 : activeLightboxIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveLightboxIndex(activeLightboxIndex === project.gallery!.length - 1 ? 0 : activeLightboxIndex + 1);
      } else if (e.key === 'Escape') {
        setActiveLightboxIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex, project]);

  const getMediaColor = (type: MediaType) => {
    switch (type) {
      case MediaType.VIDEO: return 'bg-[#FF3B30]';
      case MediaType.BOTH: return 'bg-[#2ECC71]';
      default: return 'bg-[#007BFF]';
    }
  };

  const galleryLayout = useMemo(() => {
    if (!project?.gallery || project.gallery.length === 0) return [];
    return [...project.gallery].map(item => ({
      ...item,
      weight: Math.random() > 0.6 ? 2.2 : 1.5
    }));
  }, [project?.gallery]);

  if (!project) return null;

  return (
    <div className="min-h-screen bg-white">
      <header className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
        <motion.img 
          initial={{ scale: 1.1, opacity: 0 }} 
          animate={{ scale: 1, opacity: 0.8 }} 
          transition={{ duration: 1.5 }} 
          src={project.thumbnailUrl} 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        
        <div className="relative z-20 text-center px-6 max-w-7xl w-full">
          <Link to="/portfolio" className="inline-flex items-center gap-3 text-white/50 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.4em] mb-12 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" /> Zpět do portfolia
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <span className={`px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-white ${getMediaColor(project.type)}`}>
              {project.type.toUpperCase()}
            </span>
            <Link 
              to={`/portfolio?spec=${project.categoryId}`}
              className="bg-white/10 backdrop-blur-md px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] border border-white/20 text-white hover:bg-[#007BFF] hover:border-[#007BFF] transition-all"
            >
              {project.category}
            </Link>
          </div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-8xl lg:text-[130px] font-black text-white uppercase tracking-tighter leading-[0.8] mb-12"
          >
            {project.title}
          </motion.h1>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-32 grid grid-cols-1 lg:grid-cols-12 gap-24">
        <div className="lg:col-span-7 space-y-12">
            <span className="text-[#007BFF] font-black text-[10px] uppercase tracking-[0.6em] block">O projektu</span>
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter leading-none text-black uppercase">{project.title}</h2>
            <p className="text-2xl font-black text-gray-950 leading-tight border-l-8 border-[#007BFF] pl-10 py-2">{project.shortDescription}</p>
            <div className="prose prose-xl max-w-none text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">{project.description}</div>
        </div>
        <div className="lg:col-span-5">
           <div className="bg-blue-50/50 p-12 space-y-8 border border-blue-100 rounded-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#007BFF]">Dodané služby</h3>
              <div className="space-y-4">
                {project.servicesDelivered?.split('\n').map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-black font-bold uppercase text-[10px] tracking-widest">
                    <div className="w-1.5 h-1.5 bg-[#007BFF] rounded-full"></div> {s}
                  </div>
                ))}
              </div>
              <Link to="/kontakt" className="block w-full bg-black text-white py-6 text-center text-[11px] font-black uppercase tracking-[0.4em] hover:bg-[#007BFF] transition-all shadow-xl mt-8">POPTAT PODOBNÝ PROJEKT</Link>
           </div>
        </div>
      </section>

      <section className="bg-white">
          <div className="w-full flex flex-wrap bg-white">
            {galleryLayout.map((item, idx) => (
              <div 
                key={item.id} 
                className="relative cursor-pointer overflow-hidden group bg-gray-50 border border-white"
                style={{ flexGrow: item.weight, flexBasis: window.innerWidth < 768 ? '100%' : `${item.weight * 300}px`, height: window.innerWidth < 768 ? '350px' : '550px' }}
                onClick={() => setActiveLightboxIndex(idx)}
              >
                <img src={item.url} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-[2s]" alt="" />
                {item.type === 'video' && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-20 h-20 bg-[#007BFF]/90 backdrop-blur-xl rounded-full flex items-center justify-center text-white shadow-2xl transition-all group-hover:scale-110"><Play size={28} fill="currentColor" /></div></div>}
              </div>
            ))}
          </div>
      </section>

      <AnimatePresence>
        {activeLightboxIndex !== null && project.gallery && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-3xl p-4" onClick={() => setActiveLightboxIndex(null)}>
            <button className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors z-50" onClick={() => setActiveLightboxIndex(null)}><X size={48} /></button>
            
            {/* Counter */}
            <div className="absolute top-10 left-10 text-white/70 font-black text-sm uppercase tracking-widest z-50">
              {activeLightboxIndex + 1} / {project.gallery.length}
            </div>
            
            {/* Left Arrow */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveLightboxIndex(activeLightboxIndex === 0 ? project.gallery!.length - 1 : activeLightboxIndex - 1);
              }}
              className="absolute left-10 top-1/2 -translate-y-1/2 p-4 hover:bg-white/10 rounded-full text-white transition-all z-50"
              title="Předchozí"
            >
              <ChevronLeft size={36} />
            </button>

            {/* Right Arrow */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveLightboxIndex(activeLightboxIndex === project.gallery!.length - 1 ? 0 : activeLightboxIndex + 1);
              }}
              className="absolute right-10 top-1/2 -translate-y-1/2 p-4 hover:bg-white/10 rounded-full text-white transition-all z-50"
              title="Další"
            >
              <ChevronRight size={36} />
            </button>

            <div className="w-full h-full flex items-center justify-center max-w-7xl mx-auto" onClick={e => e.stopPropagation()}>
               {project.gallery[activeLightboxIndex].type === 'video' ? (
                 <video src={project.gallery[activeLightboxIndex].url} autoPlay controls className="max-w-full max-h-[90vh] object-contain shadow-2xl" />
               ) : (
                 <img src={project.gallery[activeLightboxIndex].url} className="max-w-full max-h-[90vh] object-contain shadow-2xl" alt="" />
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectDetail;
