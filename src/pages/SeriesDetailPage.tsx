import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi } from '@/lib/xtream-api';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Play, MonitorPlay } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playFullscreen } from '@/lib/native-player';

const SeriesDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { credentials, addToHistory } = useIptv();
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

  const { data: detail, isLoading } = useQuery({
    queryKey: ['series-detail', credentials?.host, id],
    queryFn: () => xtreamApi.getSeriesInfo(credentials!, Number(id)),
    enabled: !!credentials && !!id,
  });

  const episodes = detail?.episodes?.[String(selectedSeason)] || [];
  const seasons = detail?.seasons || [];
  const backdropUrl = detail?.info?.backdrop_path?.[0] || detail?.info?.cover || '';

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
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Backdrop Header */}
      <div className="relative w-full aspect-video overflow-hidden">
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <MonitorPlay className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-background/60 backdrop-blur-sm text-foreground hover:bg-background/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Title & info over gradient */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <h1 className="text-xl font-bold text-foreground drop-shadow-lg">
            {detail?.info?.name}
          </h1>
          {detail?.info?.genre && (
            <p className="text-xs text-muted-foreground">{detail.info.genre}</p>
          )}
        </div>
      </div>

      {/* Plot & Cast */}
      <div className="px-4 py-3 space-y-2">
        {detail?.info?.plot && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
            {detail.info.plot}
          </p>
        )}
        {detail?.info?.cast && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Elenco:</span> {detail.info.cast}
          </p>
        )}
      </div>

      {/* Season selector */}
      <div className="px-4 py-2 overflow-x-auto flex gap-2 no-scrollbar">
        {seasons.map(s => (
          <button
            key={s.season_number}
            onClick={() => setSelectedSeason(s.season_number)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0',
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
      <div className="px-4 pt-2 space-y-1.5">
        {episodes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum episódio disponível nesta temporada.
          </p>
        )}
        {episodes.map(ep => {
          const epLabel = `S${String(ep.season).padStart(2, '0')}E${String(ep.episode_num).padStart(2, '0')}`;
          return (
            <button
              key={ep.id}
              onClick={() => handlePlayEpisode(ep)}
              className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left hover:bg-muted/60 active:bg-muted"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Play className="w-4 h-4 text-primary ml-0.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  <span className="text-primary">{epLabel}</span> — {ep.title}
                </p>
                {ep.info?.duration && (
                  <p className="text-xs text-muted-foreground">{ep.info.duration}</p>
                )}
                {ep.info?.plot && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{ep.info.plot}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SeriesDetailPage;
