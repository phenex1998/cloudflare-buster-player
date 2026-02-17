import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi } from '@/lib/xtream-api';
import VideoPlayerModal from '@/components/VideoPlayerModal';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

const SeriesDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { credentials, addToHistory } = useIptv();
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [activeEpisode, setActiveEpisode] = useState<{ id: string; ext: string; title: string } | null>(null);

  const { data: detail, isLoading } = useQuery({
    queryKey: ['series-detail', credentials?.host, id],
    queryFn: () => xtreamApi.getSeriesInfo(credentials!, Number(id)),
    enabled: !!credentials && !!id,
  });

  const episodes = detail?.episodes?.[String(selectedSeason)] || [];
  const seasons = detail?.seasons || [];

  const playEpisode = (ep: typeof episodes[0]) => {
    setActiveEpisode({ id: ep.id, ext: ep.container_extension, title: ep.title });
    addToHistory({ id: ep.id, type: 'series', name: `${detail?.info?.name} - ${ep.title}` });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold truncate text-foreground">{detail?.info?.name}</h1>
      </div>

      {/* Modal player overlay */}
      {activeEpisode && credentials && (
        <VideoPlayerModal
          url={xtreamApi.getSeriesStreamUrl(credentials, activeEpisode.id, activeEpisode.ext)}
          title={activeEpisode.title}
          onClose={() => setActiveEpisode(null)}
        />
      )}

      {/* Info */}
      {detail?.info?.plot && (
        <div className="px-4 py-3">
          <p className="text-sm text-muted-foreground line-clamp-3">{detail.info.plot}</p>
        </div>
      )}

      {/* Season selector */}
      <div className="px-4 py-2 overflow-x-auto flex gap-2 no-scrollbar">
        {seasons.map(s => (
          <button
            key={s.season_number}
            onClick={() => setSelectedSeason(s.season_number)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
              selectedSeason === s.season_number ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            {s.name || `Temporada ${s.season_number}`}
          </button>
        ))}
      </div>

      {/* Episodes */}
      <div className="px-4 space-y-1">
        {episodes.map(ep => (
          <button
            key={ep.id}
            onClick={() => playEpisode(ep)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
              activeEpisode?.id === ep.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
            )}
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Play className="w-3.5 h-3.5 text-muted-foreground ml-0.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                E{ep.episode_num} - {ep.title}
              </p>
              {ep.info?.duration && (
                <p className="text-xs text-muted-foreground">{ep.info.duration}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SeriesDetailPage;
