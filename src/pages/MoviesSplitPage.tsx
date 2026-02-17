import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi, VodStream, Category } from '@/lib/xtream-api';
import IconSidebar from '@/components/IconSidebar';
import InlinePlayer from '@/components/InlinePlayer';
import { Skeleton } from '@/components/ui/skeleton';
import { Film } from 'lucide-react';
import { cn } from '@/lib/utils';

const MoviesSplitPage: React.FC = () => {
  const { credentials, addToHistory } = useIptv();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [activeMovie, setActiveMovie] = useState<VodStream | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['vod-categories', credentials?.host],
    queryFn: () => xtreamApi.getVodCategories(credentials!),
    enabled: !!credentials,
  });

  const { data: movies = [], isLoading } = useQuery({
    queryKey: ['vod-streams', credentials?.host, selectedCategoryId || 'all'],
    queryFn: () => xtreamApi.getVodStreams(credentials!, selectedCategoryId || undefined),
    enabled: !!credentials,
  });

  const handleSelectMovie = (movie: VodStream) => {
    setActiveMovie(movie);
    addToHistory({ id: movie.stream_id, type: 'vod', name: movie.name, icon: movie.stream_icon });
  };

  const streamUrl = activeMovie && credentials
    ? xtreamApi.getVodStreamUrl(credentials, activeMovie.stream_id, activeMovie.container_extension || 'mp4')
    : null;

  return (
    <div className="w-full h-full flex overflow-hidden">
      <IconSidebar />

      {/* Categories */}
      <div className="w-[20%] h-full flex flex-col border-r border-border bg-card/30 shrink-0">
        <div className="px-3 py-2.5 border-b border-border">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Categorias</h2>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={cn(
              'w-full text-left px-3 py-2 text-sm transition-colors',
              selectedCategoryId === null
                ? 'bg-primary/15 text-primary border-l-2 border-primary font-semibold'
                : 'text-foreground hover:bg-muted/40'
            )}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.category_id}
              onClick={() => setSelectedCategoryId(cat.category_id)}
              className={cn(
                'w-full text-left px-3 py-2 text-sm transition-colors',
                selectedCategoryId === cat.category_id
                  ? 'bg-primary/15 text-primary border-l-2 border-primary font-semibold'
                  : 'text-foreground hover:bg-muted/40'
              )}
            >
              {cat.category_name}
            </button>
          ))}
        </div>
      </div>

      {/* Movies list */}
      <div className="w-[30%] h-full flex flex-col border-r border-border bg-card/20 shrink-0">
        <div className="px-3 py-2.5 border-b border-border">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Filmes ({movies.length})
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2">
                <Skeleton className="w-10 h-14 rounded" />
                <Skeleton className="h-3 flex-1" />
              </div>
            ))
          ) : (
            movies.map(movie => (
              <button
                key={movie.stream_id}
                onClick={() => handleSelectMovie(movie)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors',
                  activeMovie?.stream_id === movie.stream_id
                    ? 'bg-primary/15 border-l-2 border-primary'
                    : 'hover:bg-muted/30'
                )}
              >
                <div className="w-10 h-14 rounded bg-muted/40 flex items-center justify-center shrink-0 overflow-hidden">
                  {movie.stream_icon ? (
                    <img src={movie.stream_icon} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <Film className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{movie.name}</p>
                  {movie.rating && <p className="text-[10px] text-muted-foreground">⭐ {movie.rating}</p>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Player */}
      <div className="flex-1 h-full">
        <InlinePlayer
          url={streamUrl}
          title={activeMovie?.name || ''}
          streamId={activeMovie?.stream_id}
          streamType="vod"
          streamIcon={activeMovie?.stream_icon}
        />
      </div>
    </div>
  );
};

export default MoviesSplitPage;
