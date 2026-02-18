import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi, VodStream } from '@/lib/xtream-api';
import IconSidebar from '@/components/IconSidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Film } from 'lucide-react';
import { cn } from '@/lib/utils';

const MoviesSplitPage: React.FC = () => {
  const { credentials } = useIptv();
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

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

  const handleMovieClick = (movie: VodStream) => {
    navigate(`/movie/${movie.stream_id}`, { state: movie });
  };

  return (
    <div className="w-full h-full flex overflow-hidden">
      <IconSidebar />

      {/* Categories */}
      <div className="w-[200px] h-full flex flex-col border-r border-border bg-card/30 shrink-0">
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

      {/* Grid of movie cards */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Filmes ({movies.length})
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-4">
          {isLoading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
              {movies.map(movie => (
                <button
                  key={movie.stream_id}
                  onClick={() => handleMovieClick(movie)}
                  className="bg-[#1a1a1a] rounded-xl border border-white/5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all aspect-[2/3] flex flex-col overflow-hidden"
                >
                  <div className="flex-1 w-full overflow-hidden flex items-center justify-center bg-black/20">
                    {movie.stream_icon ? (
                      <img
                        src={movie.stream_icon}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Film className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] text-center text-foreground truncate">{movie.name}</p>
                    {movie.rating && (
                      <p className="text-[10px] text-center text-muted-foreground">⭐ {movie.rating}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoviesSplitPage;
