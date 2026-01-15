
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Project, MediaType, GalleryItem } from '../types';
import { PROJECTS as DEFAULT_PROJECTS } from '../constants';
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
    const saved = localStorage.getItem('jakub_minka_projects');
    const allProjects: Project[] = saved ? JSON.parse(saved) : DEFAULT_PROJECTS;
    const found = allProjects.find(p => p.id === id);
    if (found) {
      setProject(found);
      document.title = `${found.title} | Jakub Minka`;
    } else {
      navigate('/portfolio');
    }
  }, [id, navigate]);

  const getMediaLabel = (type: MediaType) => {
    switch (type) {
      case MediaType.VIDEO: return <><Play size={10} fill="currentColor" /> FILM</>;
      case MediaType.BOTH: return <><Layers size={10} /> KOMBO</>;
      default: return <><Camera size={10} /> FOTO</>;
    }
  };

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
  const isOnlyOneVideo = project.gallery?.length === 1 && project.gallery[0].type === 'video';

  return (
    <div className="min-h-screen bg-white">
      {/* Immersive Header */}
      <header className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
        {project.thumbnailSource === 'youtube' ? (
          <div className="absolute inset-0 w-full h-full">
             <iframe src={`${project.thumbnailUrl}?autoplay=1&mute=1&loop=1&controls=0&playlist=${project.thumbnailUrl.split('/').pop()}`} className="w-full h-full object-cover scale-[1.3] pointer-events-none opacity-50" />
          </div>
        ) : (
          <motion.img initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.5 }} src={project.thumbnailUrl} className="absolute inset-0 w-full h-full object-cover grayscale-[0.2]" />
        )}
        
        <div className="relative z-20 text-center px-6 max-w-7xl w-full">
          <Link to="/portfolio" className="inline-flex items-center gap-3 text-white/50 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.4em] mb-12 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" /> Zpět do portfolia
          </Link>

          {/* PROJECT METADATA BADGES */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-8"
          >
            <span className={`px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-white shadow-xl ${getMediaColor(project.type)}`}>
              {getMediaLabel(project.type)}
            </span>
            <Link 
              to={`/portfolio?spec=${project.categoryId}`}
              className="bg-white/10 backdrop-blur-md px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] border border-white/20 text-white hover:bg-white hover:text-black transition-all"
            >
              {project.category}
            </Link>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-8xl lg:text-[130px] font-black text-white uppercase tracking-tighter leading-[0.8] mb-12 drop-shadow-2xl"
          >
            {project.title}
          </motion.h1>
        </div>
      </header>

      {/* Story Section */}
      <section className="max-w-7xl mx-auto px-6 py-32 grid grid-cols-1 lg:grid-cols-12 gap-24">
        <div className="lg:col-span-7 space-y-12">
            <span className="text-[#007BFF] font-black text-[10px] uppercase tracking-[0.6em] block">Case Study</span>
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter leading-none text-black uppercase">{project.title}</h2>
            <p className="text-2xl font-black text-gray-950 leading-tight border-l-8 border-[#007BFF] pl-10 py-2">{project.shortDescription}</p>
            <div className="prose prose-xl max-w-none text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">{project.description}</div>
        </div>
        <div className="lg:col-span-5 h-fit sticky top-32">
          <div className="bg-gray-50 p-12 space-y-12 border border-gray-100">
             {project.servicesDelivered && (
               <div className="space-y-8">
                 <div className="flex items-center gap-4 text-black"><span className="text-sm font-black uppercase tracking-[0.3em]">Dodané výstupy</span></div>
                 <div className="grid grid-cols-1 gap-3">
                    {project.servicesDelivered.split('\n').map((line, i) => (
                      <div key={i} className="bg-white p-5 border border-gray-100 flex items-center gap-4"><div className="w-2 h-2 bg-[#007BFF] rounded-full"></div><p className="text-[11px] font-black text-gray-900 uppercase tracking-widest">{line}</p></div>
                    ))}
                 </div>
               </div>
             )}
             <Link to="/kontakt" className="block w-full bg-black text-white py-7 text-center text-[11px] font-black uppercase tracking-[0.5em] hover:bg-[#007BFF] transition-all shadow-xl">POPTAT PROJEKT</Link>
          </div>
        </div>
      </section>

      {/* Main Visuals - Clean Grid */}
      <section className="bg-black pt-1">
        {isOnlyOneVideo ? (
          <div className="w-full aspect-video bg-black shadow-2xl relative overflow-hidden">
             {project.gallery![0].source === 'youtube' ? <iframe src={`${project.gallery![0].url}?rel=0&modestbranding=1`} className="w-full h-full" allowFullScreen /> : <video src={project.gallery![0].url} controls className="w-full h-full object-cover" />}
          </div>
        ) : (
          <div className="w-full flex flex-wrap bg-black">
            {galleryLayout.map((item, idx) => (
              <motion.div 
                key={item.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} 
                className="relative cursor-pointer overflow-hidden group bg-gray-900"
                style={{ flexGrow: item.weight, flexBasis: window.innerWidth < 768 ? '100%' : `${item.weight * 300}px`, height: window.innerWidth < 768 ? '350px' : '550px' }}
                onClick={() => setActiveLightboxIndex(idx)}
              >
                <img src={item.type === 'video' && item.source === 'youtube' ? `https://img.youtube.com/vi/${item.url.split('/').pop()}/maxresdefault.jpg` : item.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[2s]" alt="" />
                {item.type === 'video' && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/20 group-hover:bg-[#FF3B30] transition-all group-hover:scale-110"><Play size={28} fill="currentColor" /></div></div>}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/0 transition-all"></div>
                <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"><div className="bg-white p-3 text-black shadow-2xl"><Maximize2 size={20} /></div></div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {activeLightboxIndex !== null && project.gallery && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4" onClick={() => setActiveLightboxIndex(null)}>
            <button className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors" onClick={() => setActiveLightboxIndex(null)}><X size={48} /></button>
            <div className="w-full h-full flex items-center justify-center max-w-7xl mx-auto" onClick={e => e.stopPropagation()}>
               {project.gallery[activeLightboxIndex].type === 'video' ? (
                 <div className="w-full aspect-video max-h-[85vh] shadow-2xl bg-black">
                    {project.gallery[activeLightboxIndex].source === 'youtube' ? <iframe src={`${project.gallery[activeLightboxIndex].url}?autoplay=1`} className="w-full h-full" allowFullScreen /> : <video src={project.gallery[activeLightboxIndex].url} autoPlay controls className="w-full h-full object-contain" />}
                 </div>
               ) : (
                 <img src={project.gallery[activeLightboxIndex].url} className="max-w-full max-h-[90vh] object-contain shadow-2xl" alt="" />
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spodní CTA odstraněno dle požadavku - tlačítko je v postranním panelu nahoře */}
    </div>
  );
};

export default ProjectDetail;
