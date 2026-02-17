import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tv, Film, MonitorPlay, CalendarDays, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/live', label: 'TV ao Vivo', icon: Tv },
  { path: '/movies', label: 'Filmes', icon: Film },
  { path: '/series', label: 'Séries', icon: MonitorPlay },
  { path: '/epg', label: 'EPG', icon: CalendarDays },
  { path: '/favorites', label: 'Favoritos', icon: Heart },
];

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map(tab => {
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className={cn('w-5 h-5', isActive && 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]')} />
              <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
