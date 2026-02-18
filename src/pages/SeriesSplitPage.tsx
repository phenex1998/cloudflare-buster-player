import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi } from '@/lib/xtream-api';
import IconSidebar from '@/components/IconSidebar';
import SeriesCard from '@/components/SeriesCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';

const SeriesSplitPage: React.FC = () => {
  const { credentials } = useIptv();
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['series-categories', credentials?.host],
    queryFn: () => xtreamApi.getSeriesCategories(credentials!),
    enabled: !!credentials,
  });

  const { data: seriesList = [], isLoading } = useQuery({
    queryKey: ['series', credentials?.host, selectedCategoryId || 'all'],
    queryFn: () => xtreamApi.getSeries(credentials!, selectedCategoryId || undefined),
    enabled: !!credentials,
  });

  const { limit, sentinelRef, hasMore } = useInfiniteScroll(seriesList.length);

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

      {/* Series grid */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Séries ({seriesList.length})
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
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3" style={{ contentVisibility: 'auto' }}>
                {seriesList.slice(0, limit).map(s => (
                  <SeriesCard
                    key={s.series_id}
                    name={s.name}
                    cover={s.cover}
                    rating={s.rating}
                    onClick={() => navigate(`/series/${s.series_id}`)}
                  />
                ))}
              </div>
              {hasMore && (
                <div ref={sentinelRef} className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeriesSplitPage;
