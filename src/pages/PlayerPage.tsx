import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Play, Pause, Maximize, Radio, Heart } from 'lucide-react';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi, LiveStream } from '@/lib/xtream-api';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Hls from 'hls.js';
import EpgSection from '@/components/EpgSection';

interface PlayerState {
  url: string;
  title?: string;
  streamId?: number;
  type?: 'live' | 'vod' | 'series';
  categoryId?: string;
  streams?: LiveStream[];
}

const PlayerPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { credentials, toggleFavorite, isFavorite, addToHistory } = useIptv();
  const state = location.state as PlayerState | undefined;

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(state?.url || '');
  const [currentTitle, setCurrentTitle] = useState(state?.title || '');
  const [currentStreamId, setCurrentStreamId] = useState(state?.streamId);

  // Determine if stream is HLS-compatible
  const isHlsStream = useCallback((url: string) => {
    const lower = url.toLowerCase();
    return lower.includes('.m3u8') || lower.includes('.ts') || state?.type === 'live';
  }, [state?.type]);

  // Attach source to video
  const attachSource = useCallback((url: string) => {
    const video = videoRef.current;
    if (!video) return;

    // Destroy previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setLoading(true);
    setError(null);

    if (isHlsStream(url) && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.error('[HLS] Fatal error:', data);
          setError('Erro ao carregar o stream. Verifique a conexão.');
          setLoading(false);
        }
      });
    } else if (isHlsStream(url) && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = url;
      video.play().catch(() => {});
    } else {
      // Direct source (VOD)
      video.src = url;
      video.play().catch(() => {});
    }
  }, [isHlsStream]);

  // Initialize player
  useEffect(() => {
    if (!currentUrl) return;
    attachSource(currentUrl);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentUrl, attachSource]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => { setPlaying(true); setLoading(false); };
    const onPause = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);
    const onError = () => {
      setError('Erro ao reproduzir o vídeo.');
      setLoading(false);
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('error', onError);
    };
  }, []);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  const requestFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (container?.requestFullscreen) container.requestFullscreen();
  };

  const handleChannelSwitch = (stream: LiveStream) => {
    if (!credentials) return;
    const url = xtreamApi.getLiveStreamUrl(credentials, stream.stream_id, 'ts');
    addToHistory({ id: stream.stream_id, type: 'live', name: stream.name, icon: stream.stream_icon });
    setCurrentUrl(url);
    setCurrentTitle(stream.name);
    setCurrentStreamId(stream.stream_id);
  };

  if (!state?.url) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Nenhum stream selecionado.</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Video Container — fixed 35vh */}
      <div
        className="relative w-full h-[35vh] bg-black z-10 flex-shrink-0"
        onClick={resetControlsTimer}
        onTouchStart={resetControlsTimer}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          style={{ background: '#000' }}
          playsInline
          autoPlay
        />

        {/* Loading spinner overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        )}

        {/* Controls overlay */}
        <div
          className={cn(
            'absolute inset-0 z-20 transition-opacity duration-300',
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent px-3 py-2 flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <h1 className="text-white text-sm font-medium truncate flex-1">{currentTitle}</h1>
          </div>

          {/* Center play/pause */}
          <button
            onClick={togglePlayPause}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            {playing ? (
              <Pause className="w-7 h-7 text-white" />
            ) : (
              <Play className="w-7 h-7 text-white" />
            )}
          </button>

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 flex items-center justify-end">
            <button
              onClick={requestFullscreen}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Maximize className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 gap-3">
            <p className="text-white/70 text-sm text-center px-6">{error}</p>
            <div className="flex gap-2">
              <button
                onClick={() => attachSource(currentUrl)}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm font-medium"
              >
                Tentar novamente
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content — scrollable bottom */}
      <div className="flex-1 overflow-y-auto bg-background">
        {/* EPG section for live streams */}
        {state.type === 'live' && currentStreamId && (
          <div className="px-4 pt-4">
            <EpgSection streamId={currentStreamId} channelName={currentTitle} />
          </div>
        )}

        {/* Channel list */}
        {state.streams && state.streams.length > 0 && (
          <div className="px-4 py-4">
            <h2 className="text-sm font-bold text-foreground tracking-wide uppercase mb-3">
              Canais da categoria
            </h2>
            <div className="space-y-1">
              {state.streams.map(stream => {
                const isActive = stream.stream_id === currentStreamId;
                return (
                  <button
                    key={stream.stream_id}
                    onClick={() => handleChannelSwitch(stream)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left',
                      isActive
                        ? 'bg-primary/10 border border-primary/30'
                        : 'bg-card border border-border hover:border-primary/20'
                    )}
                  >
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {stream.stream_icon ? (
                        <img
                          src={stream.stream_icon}
                          alt={stream.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <Radio className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Name */}
                    <span className={cn(
                      'text-sm font-medium truncate flex-1',
                      isActive ? 'text-primary' : 'text-foreground'
                    )}>
                      {stream.name}
                    </span>

                    {/* LIVE badge */}
                    <Badge variant="destructive" className="px-1.5 py-0 text-[9px] leading-4 font-bold rounded-sm flex-shrink-0">
                      LIVE
                    </Badge>

                    {/* Favorite */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleFavorite({ id: stream.stream_id, type: 'live', name: stream.name, icon: stream.stream_icon });
                      }}
                      className="p-1 flex-shrink-0"
                    >
                      <Heart className={cn('w-4 h-4', isFavorite(stream.stream_id, 'live') ? 'fill-primary text-primary' : 'text-muted-foreground')} />
                    </button>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerPage;
