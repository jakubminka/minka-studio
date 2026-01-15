
import React from 'react';
import { Link } from 'react-router-dom';

const Logo: React.FC = () => {
  return (
    <Link to="/" className="flex items-center gap-4 group py-1 shrink-0">
      {/* Icon Square */}
      <div className="w-11 h-11 bg-black flex items-center justify-center transition-transform duration-500 group-hover:scale-105 shrink-0">
        <span className="font-syne text-white text-2xl font-bold tracking-tighter">
          M
        </span>
      </div>

      {/* Brand Text to the Right */}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className="font-syne text-[22px] font-light uppercase tracking-tight text-gray-950 leading-none">
            Minka
          </span>
          <span className="font-syne text-[10px] font-extralight uppercase tracking-[0.4em] text-[#007BFF]">
            Studio
          </span>
        </div>
        <span className="text-[7px] text-gray-400 font-black uppercase tracking-[0.4em] leading-none mt-1.5">
          fotograf & kameraman
        </span>
      </div>
    </Link>
  );
};

export default Logo;
