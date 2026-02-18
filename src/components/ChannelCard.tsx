import React from 'react';
import { Radio } from 'lucide-react';

interface ChannelCardProps {
  name: string;
  icon?: string;
  onClick: () => void;
}

const ChannelCard: React.FC<ChannelCardProps> = ({ name, icon, onClick }) => (
  <button
    onClick={onClick}
    className="bg-[#1a1a1a] rounded-xl border border-white/5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all aspect-square flex flex-col items-center justify-center gap-2 p-3"
  >
    <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
      {icon ? (
        <img
          src={icon}
          alt=""
          className="max-w-full max-h-full object-contain"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <Radio className="w-8 h-8 text-muted-foreground" />
      )}
    </div>
    <p className="text-[11px] text-center text-foreground truncate w-full">{name}</p>
  </button>
);

export default React.memo(ChannelCard);
