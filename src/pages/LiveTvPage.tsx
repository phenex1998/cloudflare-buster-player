import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi, LiveStream, Category } from '@/lib/xtream-api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Heart, Radio, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const LiveTvPage: React.FC = () => {
  const { credentials, toggleFavorite, isFavorite, addToHistory } = useIptv();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['live-categories', credentials?.host],
    queryFn: () => xtreamApi.getLiveCategories(credentials!),
    enabled: !!credentials,
  });

  const { data: allStreams = [], isLoading } = useQuery({
    queryKey: ['live-streams-all', credentials?.host],
    queryFn: () => xtreamApi.getLiveStreams(credentials!),
    enabled: !!credentials,
  });

  // Group streams by category
  const categoryMap = useMemo(() => {
    const map = new Map<string, { category: Category; streams: LiveStream[] }>();
    categories.forEach(cat => map.set(cat.category_id, { category: cat, streams: [] }));
    allStreams.forEach(s => {
      const entry = map.get(s.category_id);
      if (entry) entry.streams.push(s);
    });
    return map;
  }, [categories, allStreams]);

  // Filtered
  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim();
    const entries = Array.from(categoryMap.values()).filter(e => e.streams.length > 0);
    if (!q) return entries;
    return entries
      .map(e => ({
        ...e,
        streams: e.streams.filter(s => s.name.toLowerCase().includes(q)),
      }))
      .filter(e => e.streams.length > 0);
  }, [categoryMap, search]);

  const handlePlay = (stream: LiveStream) => {
    addToHistory({ id: stream.stream_id, type: 'live', name: stream.name, icon: stream.stream_icon });
    if (credentials) {
      const url = xtreamApi.getLiveStreamUrl(credentials, stream.stream_id, 'ts');
      navigate('/player', { state: { url, title: stream.name } });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Search bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar canais..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Channel grid by category */}
      <div className="px-4 space-y-6 mt-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-5 w-40 mb-3 rounded" />
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton key={j} className="aspect-square rounded-xl" />
                ))}
              </div>
            </div>
          ))
        ) : filteredCategories.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">Nenhum canal encontrado.</p>
        ) : (
          filteredCategories.map(({ category, streams }) => (
            <section key={category.category_id}>
              <h2 className="text-sm font-bold text-foreground tracking-wide uppercase mb-3">
                {category.category_name}
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {streams.map(stream => (
                  <button
                    key={stream.stream_id}
                    onClick={() => handlePlay(stream)}
                    className={cn(
                      'group relative flex flex-col items-center rounded-xl overflow-hidden transition-all',
                      'bg-card border border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5'
                    )}
                  >
                    {/* LIVE badge */}
                    <div className="absolute top-1.5 left-1.5 z-10">
                      <Badge variant="destructive" className="px-1.5 py-0 text-[9px] leading-4 font-bold rounded-sm">
                        LIVE
                      </Badge>
                    </div>

                    {/* Favorite */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleFavorite({ id: stream.stream_id, type: 'live', name: stream.name, icon: stream.stream_icon });
                      }}
                      className="absolute top-1.5 right-1.5 z-10 p-1 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Heart className={cn('w-3 h-3', isFavorite(stream.stream_id, 'live') ? 'fill-primary text-primary' : 'text-white/70')} />
                    </button>

                    {/* Logo */}
                    <div className="w-full aspect-square flex items-center justify-center p-3 bg-muted/30">
                      {stream.stream_icon ? (
                        <img
                          src={stream.stream_icon}
                          alt={stream.name}
                          className="max-w-full max-h-full object-contain"
                          loading="lazy"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <Radio className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>

                    {/* Name */}
                    <div className="w-full px-2 py-2 bg-card">
                      <p className="text-[11px] font-medium text-foreground truncate text-center leading-tight">
                        {stream.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveTvPage;
