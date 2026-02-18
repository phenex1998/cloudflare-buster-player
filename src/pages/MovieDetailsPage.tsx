import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi, VodStream } from '@/lib/xtream-api';
import { playFullscreen } from '@/lib/native-player';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Play, Heart, ExternalLink, Star, Calendar, Clock, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const MovieDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { credentials, addToHistory, toggleFavorite, isFavorite } = useIptv();
  const movie = location.state as VodStream | undefined;
  const [showFullPlot, setShowFullPlot] = useState(false);

  const streamId = Number(id);

  // Fetch Xtream VOD info
  const { data: vodInfo } = useQuery({
    queryKey: ['vod-info', credentials?.host, streamId],
    queryFn: () => xtreamApi.getVodInfo(credentials!, streamId),
    enabled: !!credentials && !!streamId,
  });

  // Fetch TMDB data
  const { data: tmdbData, isLoading: tmdbLoading } = useQuery({
    queryKey: ['tmdb-movie', movie?.name || vodInfo?.info?.name],
    queryFn: async () => {
      const name = movie?.name || vodInfo?.info?.name;
      if (!name) return null;
      const { data, error } = await supabase.functions.invoke('tmdb-proxy', {
        body: { query: name },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!(movie?.name || vodInfo?.info?.name),
  });

  const title = tmdbData?.title || movie?.name || vodInfo?.info?.name || 'Filme';
  const overview = tmdbData?.overview || vodInfo?.info?.plot || '';
  const rating = tmdbData?.vote_average?.toFixed(1) || movie?.rating || vodInfo?.info?.rating || '';
  const year = tmdbData?.release_date?.substring(0, 4) || vodInfo?.info?.releasedate?.substring(0, 4) || '';
  const runtime = tmdbData?.runtime ? `${tmdbData.runtime} min` : vodInfo?.info?.duration || '';
  const director = tmdbData?.director || vodInfo?.info?.director || '';
  const cast = tmdbData?.cast || vodInfo?.info?.cast || '';
  const containerExt = (vodInfo?.info?.container_extension || movie?.container_extension || 'mp4').toUpperCase();
  const backdrop = tmdbData?.backdrop_path || (vodInfo?.info?.backdrop_path?.length ? vodInfo.info.backdrop_path[0] : null);
  const poster = tmdbData?.poster_path || vodInfo?.info?.movie_image || movie?.stream_icon || '';
  const trailer = vodInfo?.info?.youtube_trailer || '';
  const genres = tmdbData?.genres?.join(', ') || vodInfo?.info?.genre || '';

  const handlePlay = async () => {
    if (!credentials) return;
    const ext = vodInfo?.info?.container_extension || movie?.container_extension || 'mp4';
    const url = xtreamApi.getVodStreamUrl(credentials, streamId, ext);
    addToHistory({ id: streamId, type: 'vod', name: title, icon: poster });

    const result = await playFullscreen(url, title);
    if (result === 'web-fallback') {
      navigate('/player', { state: { url, title, type: 'vod' } });
    }
  };

  const favItem = { id: streamId, type: 'vod' as const, name: title, icon: poster };
  const isFav = isFavorite(streamId, 'vod');

  return (
    <div className="relative w-full h-full overflow-y-auto bg-background">
      {/* Backdrop Hero */}
      <div className="absolute inset-0 h-[70vh]">
        {backdrop ? (
          <img src={backdrop} alt="" className="w-full h-full object-cover" />
        ) : poster ? (
          <img src={poster} alt="" className="w-full h-full object-cover blur-xl scale-110" />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-50 p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
      </button>

      {/* Content */}
      <div className="relative z-10 pt-[20vh] px-6 pb-10 max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Poster */}
        <div className="shrink-0 flex justify-center md:justify-start">
          {poster ? (
            <img
              src={poster}
              alt={title}
              className="h-[300px] w-auto rounded-xl shadow-2xl object-cover"
            />
          ) : (
            <div className="h-[300px] w-[200px] rounded-xl bg-muted flex items-center justify-center">
              <Film className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="flex-1 min-w-0 space-y-4">
          {tmdbLoading ? (
            <Skeleton className="h-10 w-3/4" />
          ) : (
            <h1 className="text-3xl font-bold text-white">{title}</h1>
          )}

          {/* Info badges */}
          <div className="flex flex-wrap gap-2">
            {rating && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                <Star className="w-3.5 h-3.5" /> {rating}
              </span>
            )}
            {year && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                <Calendar className="w-3.5 h-3.5" /> {year}
              </span>
            )}
            {runtime && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                <Clock className="w-3.5 h-3.5" /> {runtime}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
              <Film className="w-3.5 h-3.5" /> {containerExt}
            </span>
          </div>

          {genres && (
            <p className="text-sm text-muted-foreground">{genres}</p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={handlePlay}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white font-bold gap-2 text-base px-8"
            >
              <Play className="w-5 h-5 fill-current" /> Assistir Agora
            </Button>
            <Button
              onClick={() => toggleFavorite(favItem)}
              variant="outline"
              size="lg"
              className={cn("gap-2", isFav && "text-red-500 border-red-500/50")}
            >
              <Heart className={cn("w-5 h-5", isFav && "fill-current")} />
              {isFav ? 'Favoritado' : 'Favoritar'}
            </Button>
            {trailer && (
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => window.open(`https://www.youtube.com/watch?v=${trailer}`, '_blank')}
              >
                <ExternalLink className="w-5 h-5" /> Trailer
              </Button>
            )}
          </div>

          {/* Synopsis */}
          {tmdbLoading ? (
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          ) : overview ? (
            <div className="pt-2">
              <p className={cn("text-[#cccccc] text-sm leading-relaxed", !showFullPlot && "line-clamp-4")}>
                {overview}
              </p>
              {overview.length > 300 && (
                <button
                  onClick={() => setShowFullPlot(v => !v)}
                  className="text-primary text-xs mt-1 hover:underline"
                >
                  {showFullPlot ? 'Mostrar menos' : 'Ler mais'}
                </button>
              )}
            </div>
          ) : null}

          {/* Cast & Director */}
          {(director || cast) && (
            <div className="text-sm text-muted-foreground space-y-1 pt-2">
              {director && <p><span className="text-foreground font-medium">Diretor:</span> {director}</p>}
              {cast && <p><span className="text-foreground font-medium">Elenco:</span> {cast}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsPage;
