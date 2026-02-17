import React, { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Maximize2, Minimize2, Pause, Play, Volume2, VolumeX,
  Loader2, AlertCircle, RefreshCw, ExternalLink
} from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  title?: string;
  onBack?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const retryCount = useRef(0);
  const maxRetries = 3;

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const resolveStreamUrl = useCallback((rawUrl: string): string => {
    // For live streams with .ts extension, try .m3u8 first for HLS
    if (rawUrl.includes('/live/') && rawUrl.endsWith('.ts')) {
      return rawUrl.replace(/\.ts$/, '.m3u8');
    }
    return rawUrl;
  }, []);

  const loadStream = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    destroyHls();
    setIsLoading(true);
    setError(null);
    retryCount.current = 0;

    const streamUrl = resolveStreamUrl(url);
    const isLive = url.includes('/live/');
    const isHlsUrl = streamUrl.endsWith('.m3u8') || streamUrl.endsWith('.m3u');

    // Strategy 1: Use HLS.js (preferred for Android WebView)
    if (Hls.isSupported() && (isHlsUrl || isLive)) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        startLevel: -1,
        // Allow HTTP content (mixed content in WebView)
        xhrSetup: (xhr, xhrUrl) => {
          xhr.open('GET', xhrUrl, true);
        },
        // Recovery settings
        fragLoadingMaxRetry: 6,
        fragLoadingMaxRetryTimeout: 8000,
        manifestLoadingMaxRetry: 4,
        manifestLoadingMaxRetryTimeout: 10000,
        levelLoadingMaxRetry: 4,
        levelLoadingMaxRetryTimeout: 10000,
        // Buffer tuning for mobile
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferHole: 0.5,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.warn('[HLS Error]', data.type, data.details, data.fatal);

        if (!data.fatal) return;

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            if (retryCount.current < maxRetries) {
              retryCount.current++;
              console.log(`[HLS] Network retry ${retryCount.current}/${maxRetries}`);
              hls.startLoad();
            } else if (isLive && streamUrl !== url) {
              // .m3u8 failed, try direct .ts URL
              console.log('[HLS] Falling back to direct .ts URL');
              destroyHls();
              tryDirectPlayback(url);
            } else {
              setError('Falha de conexão com o stream');
              setIsLoading(false);
            }
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            if (retryCount.current < maxRetries) {
              retryCount.current++;
              hls.recoverMediaError();
            } else {
              setError('Erro de mídia ao reproduzir');
              setIsLoading(false);
            }
            break;
          default:
            destroyHls();
            if (isLive) {
              tryDirectPlayback(url);
            } else {
              setError('Erro ao carregar o stream');
              setIsLoading(false);
            }
            break;
        }
      });

      hlsRef.current = hls;
    }
    // Strategy 2: Native HLS support (Safari / iOS)
    else if (video.canPlayType('application/vnd.apple.mpegurl') && (isHlsUrl || isLive)) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => setIsLoading(false), { once: true });
      video.play().catch(() => {});
    }
    // Strategy 3: Direct playback (VOD, non-HLS)
    else {
      tryDirectPlayback(url);
    }
  }, [url, destroyHls, resolveStreamUrl]);

  const tryDirectPlayback = useCallback((directUrl: string) => {
    const video = videoRef.current;
    if (!video) return;
    setIsLoading(true);
    video.src = directUrl;
    video.load();
    video.play().catch(() => {
      setError('Não foi possível reproduzir este conteúdo');
      setIsLoading(false);
    });
  }, []);

  // Load stream on URL change
  useEffect(() => {
    loadStream();

    const video = videoRef.current;
    if (!video) return;

    const onPlaying = () => { setIsLoading(false); setIsPlaying(true); };
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onError = () => {
      if (!video.src || video.src === window.location.href) return;
      setError('Erro ao carregar o stream');
      setIsLoading(false);
    };

    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
      destroyHls();
    };
  }, [url, loadStream, destroyHls]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { video.play(); }
    else { video.pause(); }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleRetry = () => {
    setError(null);
    retryCount.current = 0;
    loadStream();
  };

  const handleOpenExternal = () => {
    window.open(url, '_system');
  };

  const handleInteraction = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 4000);
  };

  return (
    <div
      ref={containerRef}
      className="video-container relative bg-black rounded-lg overflow-hidden aspect-video"
      onMouseMove={handleInteraction}
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
        muted={false}
      />

      {/* Loading overlay */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
          <p className="text-white/70 text-xs">Conectando ao stream...</p>
        </div>
      )}

      {/* Error overlay with retry/external buttons */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4 p-6">
          <AlertCircle className="w-10 h-10 text-destructive" />
          <p className="text-white text-sm text-center">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); handleRetry(); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium active:scale-95 transition-transform"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenExternal(); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm font-medium active:scale-95 transition-transform"
            >
              <ExternalLink className="w-4 h-4" />
              Player Externo
            </button>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 transition-opacity duration-300 ${showControls && !error ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {title && (
          <div className="absolute top-0 left-0 right-0 p-3">
            <p className="text-white text-sm font-medium truncate">{title}</p>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white active:bg-white/30 transition-colors"
          >
            {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-4">
          <button
            onClick={(e) => { e.stopPropagation(); toggleMute(); }}
            className="text-white/80 active:text-white p-1"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <button
            onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
            className="text-white/80 active:text-white p-1"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
