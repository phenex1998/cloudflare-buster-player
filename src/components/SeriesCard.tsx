import React from 'react';
import { MonitorPlay } from 'lucide-react';

interface SeriesCardProps {
  name: string;
  cover?: string;
  rating?: string;
  onClick: () => void;
}

const SeriesCard: React.FC<SeriesCardProps> = ({ name, cover, rating, onClick }) => (
  <button
    onClick={onClick}
    className="bg-[#1a1a1a] rounded-xl border border-white/5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all aspect-[2/3] flex flex-col overflow-hidden"
  >
    <div className="flex-1 w-full overflow-hidden flex items-center justify-center bg-black/20">
      {cover ? (
        <img
          src={cover}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <MonitorPlay className="w-8 h-8 text-muted-foreground" />
      )}
    </div>
    <div className="p-2">
      <p className="text-[11px] text-center text-foreground truncate">{name}</p>
      {rating && <p className="text-[10px] text-center text-muted-foreground">⭐ {rating}</p>}
    </div>
  </button>
);

export default React.memo(SeriesCard);
