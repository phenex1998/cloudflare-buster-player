import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi } from '@/lib/xtream-api';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Play, MonitorPlay, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playFullscreen } from '@/lib/native-player';
import { Button } from '@/components/ui/button';

const SeriesDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { credentials, addToHistory, toggleFavorite, isFavorite } = useIptv();
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

  const { data: detail, isLoading } = useQuery({
    queryKey: ['series-detail', credentials?.host, id],
    queryFn: () => xtreamApi.getSeriesInfo(credentials!, Number(id)),
    enabled: !!credentials && !!id,
  });

  const episodes = detail?.episodes?.[String(selectedSeason)] || [];
  const seasons = detail?.seasons || [];
  const backdropUrl = detail?.info?.backdrop_path?.[0] || detail?.info?.cover || '';
  const poster = detail?.info?.cover || '';

  // Auto-select first available season
  React.useEffect(() => {
    if (seasons.length > 0 && !seasons.find(s => s.season_number === selectedSeason)) {
      setSelectedSeason(seasons[0].season_number);
    }
  }, [seasons, selectedSeason]);

  const handlePlayEpisode = async (ep: typeof episodes[0]) => {
    if (!credentials) return;
    const url = xtreamApi.getSeriesStreamUrl(credentials, ep.id, ep.container_extension);
    const epLabel = `S${String(ep.season).padStart(2, '0')}E${String(ep.episode_num).padStart(2, '0')}`;
    const title = `${detail?.info?.name} - ${epLabel} - ${ep.title}`;

    addToHistory({ id: ep.id, type: 'series', name: title });

    const result = await playFullscreen(url, title);
    if (result === 'web-fallback') {
      navigate('/player', { state: { url, title } });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full overflow-y-auto bg-background p-6 flex gap-6">
        <Skeleton className="h-[250px] w-[170px] rounded-xl shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-10 w-48" />
          <div className="space-y-2 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-y-auto bg-background">
      {/* Backdrop */}
      <div className="absolute inset-0 h-[70vh]">
        {backdropUrl ? (
          <img src={backdropUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="fixed z-50 p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
        style={{
          top: 'calc(1rem + env(safe-area-inset-top))',
          left: 'calc(1rem + env(safe-area-inset-left))',
        }}
      >
        <ArrowLeft className="w-5 h-5 text-white" />
      </button>

      {/* Content */}
      <div className="relative z-10 pt-[10vh] px-6 pb-10 max-w-5xl mx-auto flex flex-row gap-8">
        {/* Poster */}
        <div className="shrink-0">
          {poster ? (
            <img
              src={poster}
              alt={detail?.info?.name}
              className="h-[260px] w-auto rounded-xl shadow-2xl object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="h-[260px] w-[175px] rounded-xl bg-muted flex items-center justify-center">
              <MonitorPlay className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Metadata + Seasons + Episodes */}
        <div className="flex-1 min-w-0 space-y-3">
          <h1 className="text-2xl font-bold text-foreground">{detail?.info?.name}</h1>

          {detail?.info?.genre && (
            <p className="text-xs text-muted-foreground">{detail.info.genre}</p>
          )}

          {detail?.info?.plot && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {detail.info.plot}
            </p>
          )}

          {detail?.info?.cast && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Elenco:</span> {detail.info.cast}
            </p>
          )}

          {/* Season selector */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {seasons.map(s => (
              <button
                key={s.season_number}
                onClick={() => setSelectedSeason(s.season_number)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                  selectedSeason === s.season_number
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {s.name || `Temporada ${s.season_number}`}
              </button>
            ))}
          </div>

          {/* Episodes */}
          <div className="space-y-1 pt-1">
            {episodes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum episódio disponível nesta temporada.
              </p>
            )}
            {episodes.map(ep => {
              const epLabel = `S${String(ep.season).padStart(2, '0')}E${String(ep.episode_num).padStart(2, '0')}`;
              return (
                <button
                  key={ep.id}
                  onClick={() => handlePlayEpisode(ep)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left hover:bg-muted/60 active:bg-muted"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Play className="w-4 h-4 text-primary ml-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      <span className="text-primary">{epLabel}</span> — {ep.title}
                    </p>
                    {ep.info?.duration && (
                      <p className="text-xs text-muted-foreground">{ep.info.duration}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeriesDetailPage;
