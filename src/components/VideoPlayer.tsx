import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { Maximize2, Minimize2, Pause, Play, Volume2, VolumeX, Loader2, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  title?: string;
  onBack?: () => void;
}

// Extract the original URL from a proxied URL for format detection
function getOriginalUrl(url: string): string {
  try {
    const u = new URL(url);
    const original = u.searchParams.get('url');
    if (original) return original;
  } catch {}
  return url;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setError(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const originalUrl = getOriginalUrl(url);
    const isLive = originalUrl.includes('/live/');
    const isHlsExt = originalUrl.includes('.m3u8') || originalUrl.includes('.m3u');
    const isTsExt = originalUrl.endsWith('.ts');

    // For live streams with .ts extension, build a .m3u8 proxy URL
    const getM3u8Url = (): string => {
      if (isLive && isTsExt) {
        const m3u8Original = originalUrl.replace(/\.ts$/, '.m3u8');
        // If the url is proxied, rebuild the proxy URL with .m3u8
        if (url !== originalUrl) {
          const u = new URL(url);
          u.searchParams.set('url', m3u8Original);
          return u.toString();
        }
        return m3u8Original;
      }
      return url;
    };

    const tryDirectPlayback = () => {
      console.log('[VideoPlayer] Trying direct playback:', url);
      video.src = url;
      video.play().catch(() => {
        setError('Não foi possível reproduzir este canal');
        setIsLoading(false);
      });
    };

    const onPlaying = () => { setIsLoading(false); setIsPlaying(true); };
    const onWaiting = () => setIsLoading(true);
    const onError = () => { setError('Erro ao carregar o stream'); setIsLoading(false); };

    video.addEventListener('playing', onPlaying);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('error', onError);

    if (isHlsExt || isLive) {
      const hlsUrl = getM3u8Url();
      console.log('[VideoPlayer] Attempting HLS playback:', hlsUrl);

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            console.warn('[VideoPlayer] HLS fatal error:', data.type, data.details);
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR && isLive && isTsExt) {
              // .m3u8 failed, try direct .ts playback
              hls.destroy();
              hlsRef.current = null;
              tryDirectPlayback();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              hls.destroy();
              hlsRef.current = null;
              tryDirectPlayback();
            }
          }
        });
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsUrl;
        video.addEventListener('loadedmetadata', () => setIsLoading(false), { once: true });
        video.play().catch(() => {});
      } else {
        tryDirectPlayback();
      }
    } else {
      // VOD / series - play directly
      console.log('[VideoPlayer] Direct playback (non-live):', url);
      video.src = url;
      video.addEventListener('loadedmetadata', () => setIsLoading(false), { once: true });
      video.play().catch(() => {});
    }

    return () => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('error', onError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { video.play(); setIsPlaying(true); }
    else { video.pause(); setIsPlaying(false); }
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

  const handleInteraction = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  };

  return (
    <div
      ref={containerRef}
      className="video-container relative bg-black rounded-lg overflow-hidden"
      onMouseMove={handleInteraction}
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <video ref={videoRef} className="w-full h-full" playsInline />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-2">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-white text-sm">{error}</p>
        </div>
      )}

      <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {title && (
          <div className="absolute top-0 left-0 right-0 p-3">
            <p className="text-white text-sm font-medium truncate">{title}</p>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          <button onClick={togglePlay} className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-3">
          <button onClick={toggleMute} className="text-white/80 hover:text-white">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <button onClick={toggleFullscreen} className="text-white/80 hover:text-white">
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
