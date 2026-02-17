import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi, VodStream, Category } from '@/lib/xtream-api';
import AppHeader from '@/components/AppHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import InlinePlayer from '@/components/InlinePlayer';

const MoviesPage: React.FC = () => {
  const { credentials, toggleFavorite, isFavorite, addToHistory } = useIptv();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeMovie, setActiveMovie] = useState<VodStream | null>(null);
  const [activePlayer, setActivePlayer] = useState<{ url: string; title: string } | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['vod-categories', credentials?.host],
    queryFn: () => xtreamApi.getVodCategories(credentials!),
    enabled: !!credentials,
  });

  const { data: movies = [], isLoading } = useQuery({
    queryKey: ['vod-streams', credentials?.host, selectedCategory],
    queryFn: () => xtreamApi.getVodStreams(credentials!, selectedCategory === 'all' ? undefined : selectedCategory),
    enabled: !!credentials,
  });

  const handlePlayMovie = (movie: VodStream) => {
    setActiveMovie(movie);
    addToHistory({ id: movie.stream_id, type: 'vod', name: movie.name, icon: movie.stream_icon });
    if (credentials) {
      const url = xtreamApi.getVodStreamUrl(credentials, movie.stream_id, movie.container_extension || 'mp4');
      setActivePlayer({ url, title: movie.name });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="Filmes" />

      {/* Inline player */}
      {activePlayer && (
        <InlinePlayer
          url={activePlayer.url}
          title={activePlayer.title}
          onClose={() => { setActivePlayer(null); setActiveMovie(null); }}
        />
      )}

      {/* Categories */}
      <div className="px-4 py-3 overflow-x-auto flex gap-2 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('all')}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
            selectedCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          Todos
        </button>
        {categories.map((cat: Category) => (
          <button
            key={cat.category_id}
            onClick={() => setSelectedCategory(cat.category_id)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
              selectedCategory === cat.category_id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {cat.category_name}
          </button>
        ))}
      </div>

      {/* Movie grid */}
      <div className="px-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {isLoading ? (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-lg" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))
        ) : (
          movies.map((movie: VodStream) => (
            <button
              key={movie.stream_id}
              onClick={() => handlePlayMovie(movie)}
              className="text-left group relative"
            >
              <div className={cn(
                'aspect-[2/3] rounded-lg overflow-hidden bg-muted border-2 transition-colors',
                activeMovie?.stream_id === movie.stream_id ? 'border-primary' : 'border-transparent'
              )}>
                {movie.stream_icon ? (
                  <img src={movie.stream_icon} alt={movie.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <p className="text-xs font-medium text-foreground mt-1.5 line-clamp-2">{movie.name}</p>
              {movie.rating && <p className="text-[10px] text-muted-foreground">⭐ {movie.rating}</p>}
              <button
                onClick={e => {
                  e.stopPropagation();
                  toggleFavorite({ id: movie.stream_id, type: 'vod', name: movie.name, icon: movie.stream_icon });
                }}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/50"
              >
                <Heart className={cn('w-3 h-3', isFavorite(movie.stream_id, 'vod') ? 'fill-primary text-primary' : 'text-white')} />
              </button>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default MoviesPage;
