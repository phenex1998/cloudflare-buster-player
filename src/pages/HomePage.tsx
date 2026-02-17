import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tv, Film, MonitorPlay, Heart, Settings, User, Power, RefreshCw } from 'lucide-react';
import { useIptv } from '@/contexts/IptvContext';
import { cn } from '@/lib/utils';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { authInfo, logout } = useIptv();
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const username = authInfo?.user_info?.username || '---';
  const expDate = authInfo?.user_info?.exp_date
    ? new Date(Number(authInfo.user_info.exp_date) * 1000).toLocaleDateString('pt-BR')
    : '---';

  const mainCards = [
    { label: 'TV AO VIVO', icon: Tv, path: '/live', color: 'from-blue-500/20 to-blue-600/5' },
    { label: 'FILMES', icon: Film, path: '/movies', color: 'from-purple-500/20 to-purple-600/5' },
    { label: 'SÉRIES', icon: MonitorPlay, path: '/series', color: 'from-emerald-500/20 to-emerald-600/5' },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Tv className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground tracking-wide">IPTV PLAYER</span>
        </div>

        <span className="text-2xl font-mono font-bold text-foreground tracking-widest tabular-nums">
          {time}
        </span>

        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <User className="w-4 h-4" />
          </button>
          <button className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            className="w-9 h-9 rounded-lg bg-destructive/20 flex items-center justify-center text-destructive hover:bg-destructive/30 transition-colors"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8">
        {/* 3 Main Cards */}
        <div className="flex items-center gap-6">
          {mainCards.map(card => (
            <button
              key={card.path}
              onClick={() => navigate(card.path)}
              className={cn(
                'glass-card w-52 h-40 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300',
                'hover:scale-105 active:scale-95'
              )}
            >
              <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br', card.color)}>
                <card.icon className="w-8 h-8 text-foreground" />
              </div>
              <span className="text-sm font-bold tracking-wider text-foreground">{card.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between px-6 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/favorites')}
            className="glass-card px-4 py-2.5 flex items-center gap-2 text-sm font-medium text-foreground hover:scale-105 transition-all"
          >
            <Heart className="w-4 h-4 text-primary" />
            Favoritos
          </button>
          <button
            className="glass-card px-4 py-2.5 flex items-center gap-2 text-sm font-medium text-foreground hover:scale-105 transition-all"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
            Ajustes
          </button>
        </div>

        <div className="glass-card px-5 py-2.5 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Usuário:</span>
            <span className="font-semibold text-foreground">{username}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Validade:</span>
            <span className="font-semibold text-foreground">{expDate}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
