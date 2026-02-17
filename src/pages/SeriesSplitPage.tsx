import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi, SeriesInfo, Category } from '@/lib/xtream-api';
import IconSidebar from '@/components/IconSidebar';
import InlinePlayer from '@/components/InlinePlayer';
import { Skeleton } from '@/components/ui/skeleton';
import { MonitorPlay, Play, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const SeriesSplitPage: React.FC = () => {
  const { credentials, addToHistory } = useIptv();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<SeriesInfo | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [activeEpisode, setActiveEpisode] = useState<{ id: string; ext: string; title: string } | null>(null);

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

  const { data: seriesDetail } = useQuery({
    queryKey: ['series-detail', credentials?.host, selectedSeries?.series_id],
    queryFn: () => xtreamApi.getSeriesInfo(credentials!, selectedSeries!.series_id),
    enabled: !!credentials && !!selectedSeries,
  });

  const episodes = seriesDetail?.episodes?.[String(selectedSeason)] || [];
  const seasons = seriesDetail?.seasons || [];

  const handlePlayEpisode = (ep: typeof episodes[0]) => {
    setActiveEpisode({ id: ep.id, ext: ep.container_extension, title: ep.title });
    addToHistory({ id: ep.id, type: 'series', name: `${selectedSeries?.name} - ${ep.title}` });
  };

  const streamUrl = activeEpisode && credentials
    ? xtreamApi.getSeriesStreamUrl(credentials, activeEpisode.id, activeEpisode.ext)
    : null;

  return (
    <div className="w-full h-full flex overflow-hidden">
      <IconSidebar />

      {/* Categories */}
      <div className="w-[18%] h-full flex flex-col border-r border-border bg-card/30 shrink-0">
        <div className="px-3 py-2.5 border-b border-border">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Categorias</h2>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <button
            onClick={() => { setSelectedCategoryId(null); setSelectedSeries(null); }}
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
              onClick={() => { setSelectedCategoryId(cat.category_id); setSelectedSeries(null); }}
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

      {/* Series / Episodes list */}
      <div className="w-[32%] h-full flex flex-col border-r border-border bg-card/20 shrink-0">
        {!selectedSeries ? (
          <>
            <div className="px-3 py-2.5 border-b border-border">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Séries ({seriesList.length})
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
                seriesList.map(s => (
                  <button
                    key={s.series_id}
                    onClick={() => { setSelectedSeries(s); setSelectedSeason(1); setActiveEpisode(null); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="w-10 h-14 rounded bg-muted/40 flex items-center justify-center shrink-0 overflow-hidden">
                      {s.cover ? (
                        <img src={s.cover} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <MonitorPlay className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{s.name}</p>
                      {s.rating && <p className="text-[10px] text-muted-foreground">⭐ {s.rating}</p>}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
              <button
                onClick={() => { setSelectedSeries(null); setActiveEpisode(null); }}
                className="text-xs text-primary hover:underline"
              >
                ← Voltar
              </button>
              <h2 className="text-xs font-bold text-foreground truncate">{selectedSeries.name}</h2>
            </div>

            {/* Season selector */}
            {seasons.length > 0 && (
              <div className="px-3 py-2 flex gap-1.5 overflow-x-auto no-scrollbar border-b border-border">
                {seasons.map(s => (
                  <button
                    key={s.season_number}
                    onClick={() => setSelectedSeason(s.season_number)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors',
                      selectedSeason === s.season_number
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {s.name || `T${s.season_number}`}
                  </button>
                ))}
              </div>
            )}

            {/* Episodes */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {episodes.map(ep => (
                <button
                  key={ep.id}
                  onClick={() => handlePlayEpisode(ep)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors',
                    activeEpisode?.id === ep.id
                      ? 'bg-primary/15 border-l-2 border-primary'
                      : 'hover:bg-muted/30'
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-muted/40 flex items-center justify-center shrink-0">
                    <Play className="w-3 h-3 text-muted-foreground ml-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">E{ep.episode_num} - {ep.title}</p>
                    {ep.info?.duration && <p className="text-[10px] text-muted-foreground">{ep.info.duration}</p>}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Player */}
      <div className="flex-1 h-full">
        <InlinePlayer
          url={streamUrl}
          title={activeEpisode ? `${selectedSeries?.name} - ${activeEpisode.title}` : ''}
          streamId={activeEpisode?.id}
          streamType="series"
        />
      </div>
    </div>
  );
};

export default SeriesSplitPage;
