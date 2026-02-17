import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi } from '@/lib/xtream-api';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Tv, Film, MonitorPlay } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SearchPage: React.FC = () => {
  const { credentials } = useIptv();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const { data: liveStreams = [] } = useQuery({
    queryKey: ['live-streams-search', credentials?.host],
    queryFn: () => xtreamApi.getLiveStreams(credentials!),
    enabled: !!credentials,
  });

  const { data: vodStreams = [] } = useQuery({
    queryKey: ['vod-streams-search', credentials?.host],
    queryFn: () => xtreamApi.getVodStreams(credentials!),
    enabled: !!credentials,
  });

  const { data: series = [] } = useQuery({
    queryKey: ['series-search', credentials?.host],
    queryFn: () => xtreamApi.getSeries(credentials!),
    enabled: !!credentials,
  });

  const results = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    const live = liveStreams.filter(s => s.name.toLowerCase().includes(q)).slice(0, 10).map(s => ({ ...s, _type: 'live' as const }));
    const vod = vodStreams.filter(s => s.name.toLowerCase().includes(q)).slice(0, 10).map(s => ({ ...s, _type: 'vod' as const }));
    const ser = series.filter(s => s.name.toLowerCase().includes(q)).slice(0, 10).map(s => ({ ...s, _type: 'series' as const }));
    return [...live, ...vod, ...ser];
  }, [query, liveStreams, vodStreams, series]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar canais, filmes, séries..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
      </div>

      <div className="px-4 py-3 space-y-1">
        {query.length < 2 ? (
          <p className="text-center text-muted-foreground text-sm py-10">Digite pelo menos 2 caracteres</p>
        ) : results.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-10">Nenhum resultado encontrado</p>
        ) : (
          results.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (item._type === 'live') navigate('/live');
                else if (item._type === 'vod') navigate('/movies');
                else navigate(`/series/${(item as any).series_id}`);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-left transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                {item._type === 'live' ? <Tv className="w-4 h-4 text-primary" /> :
                 item._type === 'vod' ? <Film className="w-4 h-4 text-primary" /> :
                 <MonitorPlay className="w-4 h-4 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{item._type === 'live' ? 'TV ao Vivo' : item._type === 'vod' ? 'Filme' : 'Série'}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default SearchPage;
