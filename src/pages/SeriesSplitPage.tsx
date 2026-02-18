import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi, SeriesInfo } from '@/lib/xtream-api';
import { playFullscreen } from '@/lib/native-player';
import IconSidebar from '@/components/IconSidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { MonitorPlay, Play, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const SeriesSplitPage: React.FC = () => {
  const { credentials, addToHistory } = useIptv();
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<SeriesInfo | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

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

  const handlePlayEpisode = async (ep: typeof episodes[0]) => {
    if (!credentials || !selectedSeries) return;
    const url = xtreamApi.getSeriesStreamUrl(credentials, ep.id, ep.container_extension);
    const title = `${selectedSeries.name} - ${ep.title}`;
    addToHistory({ id: ep.id, type: 'series', name: title });

    const result = await playFullscreen(url, title);
    if (result === 'web-fallback') {
      navigate('/player', { state: { url, title, type: 'series' } });
    }
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

      {/* Main area: series grid OR episode list */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        {!selectedSeries ? (
          <>
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
                <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
                  {seriesList.map(s => (
                    <button
                      key={s.series_id}
                      onClick={() => { setSelectedSeries(s); setSelectedSeason(1); }}
                      className="bg-[#1a1a1a] rounded-xl border border-white/5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all aspect-[2/3] flex flex-col overflow-hidden"
                    >
                      <div className="flex-1 w-full overflow-hidden flex items-center justify-center bg-black/20">
                        {s.cover ? (
                          <img src={s.cover} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <MonitorPlay className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-[11px] text-center text-foreground truncate">{s.name}</p>
                        {s.rating && <p className="text-[10px] text-center text-muted-foreground">⭐ {s.rating}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="px-4 py-2.5 border-b border-border flex items-center gap-3">
              <button
                onClick={() => setSelectedSeries(null)}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-sm font-bold text-foreground truncate">{selectedSeries.name}</h2>
            </div>

            {/* Season selector */}
            {seasons.length > 0 && (
              <div className="px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar border-b border-border">
                {seasons.map(s => (
                  <button
                    key={s.season_number}
                    onClick={() => setSelectedSeason(s.season_number)}
                    className={cn(
                      'px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors',
                      selectedSeason === s.season_number
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {s.name || `T${s.season_number}`}
                  </button>
                ))}
              </div>
            )}

            {/* Episodes grid */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
                {episodes.map(ep => (
                  <button
                    key={ep.id}
                    onClick={() => handlePlayEpisode(ep)}
                    className="bg-[#1a1a1a] rounded-xl border border-white/5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all flex items-center gap-3 p-3 text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Play className="w-4 h-4 text-primary ml-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">E{ep.episode_num} - {ep.title}</p>
                      {ep.info?.duration && <p className="text-[10px] text-muted-foreground">{ep.info.duration}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SeriesSplitPage;
