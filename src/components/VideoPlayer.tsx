import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { Maximize2, Minimize2, Pause, Play, Volume2, VolumeX, Loader2, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  title?: string;
  onBack?: () => void;
}

/**
 * Detect if this is a live stream URL (contains /live/ in the path).
 */
function isLiveStream(url: string): boolean {
  return url.includes('/live/');
}

/**
 * Convert a .ts live URL to .m3u8 for HLS.js consumption.
 */
function toM3u8Url(url: string): string {
  return url.replace(/\.ts(\?.*)?$/, '.m3u8$1');
}

/**
 * Create a synthetic single-segment HLS manifest pointing to a .ts URL.
 * This forces HLS.js to decode the .ts via MSE instead of native playback.
 */
function createSyntheticManifest(tsUrl: string): string {
  const manifest = [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
    '#EXT-X-TARGETDURATION:10',
    '#EXT-X-MEDIA-SEQUENCE:0',
    '#EXTINF:10.0,',
    tsUrl,
    '#EXT-X-ENDLIST',
  ].join('\n');
  return URL.createObjectURL(new Blob([manifest], { type: 'application/vnd.apple.mpegurl' }));
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
  const syntheticBlobUrl = useRef<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setError(null);

    // Cleanup previous instance
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (syntheticBlobUrl.current) { URL.revokeObjectURL(syntheticBlobUrl.current); syntheticBlobUrl.current = null; }

    const isLive = isLiveStream(url);
    const isTsExt = /\.ts(\?.*)?$/.test(url);
    const isHlsExt = /\.(m3u8?|m3u)(\?.*)?$/i.test(url);

    const onPlaying = () => { setIsLoading(false); setIsPlaying(true); };
    const onWaiting = () => setIsLoading(true);
    const onVideoError = () => { setError('Erro ao carregar o stream'); setIsLoading(false); };

    video.addEventListener('playing', onPlaying);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('error', onVideoError);

    // Timeout: 15s to detect dead streams
    const timeout = setTimeout(() => {
      setError('Timeout: não foi possível carregar o stream');
      setIsLoading(false);
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    }, 15000);

    const clearTimeoutOnSuccess = () => clearTimeout(timeout);

    if (isLive || isHlsExt || isTsExt) {
      // ─── HLS/Live path: ALWAYS use HLS.js via MSE ───
      // For .ts URLs, first try converting to .m3u8 (most IPTV providers support both)
      const hlsUrl = isTsExt ? toM3u8Url(url) : url;
      console.log('[VideoPlayer] HLS.js playback (direct URL, no proxy):', hlsUrl);

      if (Hls.isSupported()) {
        const startHls = (sourceUrl: string) => {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            // xhrSetup: pass-through for direct URLs, no special headers needed
            // If a provider requires User-Agent or auth, add headers here
            xhrSetup: (xhr, xhrUrl) => {
              xhr.open('GET', xhrUrl, true);
            },
          });

          hls.loadSource(sourceUrl);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            clearTimeoutOnSuccess();
            video.play().catch(() => {});
          });

          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal) return;
            console.warn('[VideoPlayer] HLS fatal error:', data.type, data.details);

            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
              return;
            }

            // If .m3u8 failed and original was .ts, try synthetic manifest
            if (isTsExt && !syntheticBlobUrl.current) {
              console.log('[VideoPlayer] .m3u8 failed → synthetic manifest for .ts');
              hls.destroy();
              hlsRef.current = null;
              const blobUrl = createSyntheticManifest(url);
              syntheticBlobUrl.current = blobUrl;
              startHls(blobUrl);
              return;
            }

            // All attempts failed
            hls.destroy();
            hlsRef.current = null;
            setError('Não foi possível reproduzir este canal');
            setIsLoading(false);
            clearTimeoutOnSuccess();
          });

          hlsRef.current = hls;
        };

        startHls(hlsUrl);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS support
        video.src = hlsUrl;
        video.addEventListener('loadedmetadata', () => { setIsLoading(false); clearTimeoutOnSuccess(); }, { once: true });
        video.play().catch(() => {});
      } else {
        setError('Seu navegador não suporta reprodução HLS');
        setIsLoading(false);
        clearTimeoutOnSuccess();
      }
    } else {
      // ─── VOD path: direct playback (mp4, mkv, etc.) ───
      console.log('[VideoPlayer] Direct playback (VOD):', url);
      video.src = url;
      video.addEventListener('loadedmetadata', () => { setIsLoading(false); clearTimeoutOnSuccess(); }, { once: true });
      video.play().catch(() => {});
    }

    return () => {
      clearTimeout(timeout);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('error', onVideoError);
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      if (syntheticBlobUrl.current) { URL.revokeObjectURL(syntheticBlobUrl.current); syntheticBlobUrl.current = null; }
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
