
import React, { useMemo, useState } from 'react';
import { Project, MediaType } from '../types';
import { Play, Camera, ArrowUpRight, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface MasonryGridProps {
  projects: Project[];
  showSpecialization?: boolean;
}

// Skutečné promíchání pole pro totální náhodu
// Added 'extends object' constraint to T to fix the "Spread types may only be created from object types" error
const shuffleArray = <T extends object>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const ProjectItem: React.FC<{ project: Project, weight: number, showSpecialization: boolean }> = ({ project, weight, showSpecialization }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const getMediaLabel = (type: MediaType) => {
    switch (type) {
      case MediaType.VIDEO: return <><Play size={10} fill="currentColor" /> FILM</>;
      case MediaType.BOTH: return <><Layers size={10} /> KOMBO</>;
      default: return <><Camera size={10} /> FOTO</>;
    }
  };

  return (
    <div 
      style={{ 
        flexGrow: weight, 
        flexBasis: window.innerWidth < 768 ? '100%' : `${weight * 300}px`,
      }}
      className="relative group overflow-hidden h-[300px] md:h-[500px] bg-black"
    >
      <Link to={`/projekt/${project.id}`} className="block w-full h-full relative">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <motion.img 
            src={project.thumbnailUrl} 
            alt={project.title}
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ duration: 1 }}
            className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-110 transition-transform duration-[3s] ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10 opacity-60 group-hover:opacity-100 transition-opacity duration-700"></div>
        </div>
        
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 text-white z-20 pointer-events-none">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`px-4 py-1 text-[8px] font-black uppercase tracking-widest flex items-center gap-2 ${project.type === MediaType.VIDEO ? 'bg-[#FF3B30]' : project.type === MediaType.BOTH ? 'bg-[#2ECC71]' : 'bg-[#007BFF]'}`}>
              {getMediaLabel(project.type)}
            </span>
            {showSpecialization && (
              <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 text-[8px] font-black uppercase tracking-widest border border-white/20">
                {project.category}
              </span>
            )}
          </div>
          
          <h3 className="text-2xl md:text-5xl font-black mb-4 tracking-tighter uppercase leading-[0.9] group-hover:text-[#007BFF] transition-colors duration-500">
            {project.title}
          </h3>
          
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] text-white/40 group-hover:text-white transition-all duration-500 group-hover:translate-x-2">
            PROHLÉDNOUT <ArrowUpRight size={16} />
          </div>
        </div>
      </Link>
    </div>
  );
};

const MasonryGrid: React.FC<MasonryGridProps> = ({ projects, showSpecialization = false }) => {
  // Každé načtení gridu vygeneruje unikátní náhodné rozložení i pořadí
  const randomizedLayout = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    
    // 1. Zamíchat pořadí projektů
    const shuffled = shuffleArray(projects);
    
    // 2. Přiřadit náhodné váhy pro flex-grow
    return shuffled.map((project) => {
      const weight = Math.random() > 0.5 ? 2.0 : 1.2;
      // Spreading 'project' is now safe because shuffleArray constrains its elements to be objects
      return { ...project, weight };
    });
  }, [projects]); 

  return (
    <div className="w-full flex flex-wrap bg-black">
      {randomizedLayout.map((project, idx) => (
        <ProjectItem 
          key={`${project.id}-${idx}`} 
          project={project} 
          weight={project.weight || 1.0} 
          showSpecialization={showSpecialization} 
        />
      ))}
    </div>
  );
};

export default MasonryGrid;
