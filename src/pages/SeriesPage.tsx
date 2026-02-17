import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi, SeriesInfo, Category } from '@/lib/xtream-api';
import AppHeader from '@/components/AppHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MonitorPlay } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const SeriesPage: React.FC = () => {
  const { credentials, toggleFavorite, isFavorite } = useIptv();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const navigate = useNavigate();

  const { data: categories = [] } = useQuery({
    queryKey: ['series-categories', credentials?.host],
    queryFn: () => xtreamApi.getSeriesCategories(credentials!),
    enabled: !!credentials,
  });

  const { data: series = [], isLoading } = useQuery({
    queryKey: ['series', credentials?.host, selectedCategory],
    queryFn: () => xtreamApi.getSeries(credentials!, selectedCategory === 'all' ? undefined : selectedCategory),
    enabled: !!credentials,
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="Séries" />

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

      {/* Series grid */}
      <div className="px-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {isLoading ? (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-lg" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))
        ) : (
          series.map((s: SeriesInfo) => (
            <button
              key={s.series_id}
              onClick={() => navigate(`/series/${s.series_id}`)}
              className="text-left group relative"
            >
              <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                {s.cover ? (
                  <img src={s.cover} alt={s.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MonitorPlay className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <p className="text-xs font-medium text-foreground mt-1.5 line-clamp-2">{s.name}</p>
              {s.rating && <p className="text-[10px] text-muted-foreground">⭐ {s.rating}</p>}
              <button
                onClick={e => {
                  e.stopPropagation();
                  toggleFavorite({ id: s.series_id, type: 'series', name: s.name, icon: s.cover });
                }}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/50"
              >
                <Heart className={cn('w-3 h-3', isFavorite(s.series_id, 'series') ? 'fill-primary text-primary' : 'text-white')} />
              </button>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default SeriesPage;
