import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { House, Tv, Film, MonitorPlay, Search, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: House, label: 'Home' },
  { path: '/live', icon: Tv, label: 'TV' },
  { path: '/movies', icon: Film, label: 'Filmes' },
  { path: '/series', icon: MonitorPlay, label: 'Séries' },
  { path: '/search', icon: Search, label: 'Busca' },
];

const IconSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="glass-sidebar w-[60px] h-full flex flex-col items-center py-4 shrink-0">
      <div className="flex flex-col items-center gap-1 flex-1">
        {navItems.map(item => {
          const isActive = item.path === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-11 h-11 flex flex-col items-center justify-center rounded-xl transition-all',
                isActive
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              )}
              title={item.label}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'drop-shadow-[0_0_8px_hsl(262,80%,60%)]')} />
              <span className="text-[8px] mt-0.5 font-medium leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
      <button
        onClick={() => {}}
        className="w-11 h-11 flex flex-col items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
        title="Ajustes"
      >
        <Settings className="w-5 h-5" />
        <span className="text-[8px] mt-0.5 font-medium">Ajustes</span>
      </button>
    </div>
  );
};

export default IconSidebar;
