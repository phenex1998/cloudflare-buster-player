import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface PlayerState {
  url: string;
  title?: string;
}

const PlayerPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const state = location.state as PlayerState | undefined;

  const tryDirectSrc = useCallback((video: HTMLVideoElement, url: string) => {
    console.log('[Player] Fallback: direct video.src =', url);
    video.src = url;
    video.load();
    video.play().catch(() => {});
  }, []);

  const tryTsFallback = useCallback((video: HTMLVideoElement, url: string) => {
    // Replace .m3u8 with .ts as last resort
    const tsUrl = url.replace(/\.m3u8(\?.*)?$/, '.ts$1');
    if (tsUrl !== url) {
      console.log('[Player] Fallback: trying .ts URL =', tsUrl);
      video.src = tsUrl;
      video.load();
      video.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !state?.url) return;

    const url = state.url.trim();
    const isHls = url.includes('.m3u8');
    let fallbackAttempted = false;

    console.log('[Player] Loading URL:', url, '| isHLS:', isHls);

    setLoading(true);
    setError(null);

    const onCanPlay = () => {
      console.log('[Player] canplay event fired');
      setLoading(false);
    };

    const onVideoError = () => {
      console.log('[Player] video error event, fallbackAttempted:', fallbackAttempted);
      if (!fallbackAttempted && isHls) {
        fallbackAttempted = true;
        tryTsFallback(video, url);
        return;
      }
      setError('Erro ao reproduzir o vídeo.');
      setLoading(false);
    };

    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', onVideoError);

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        xhrSetup: (xhr) => {
          xhr.timeout = 15000;
        },
      });
      hlsRef.current = hls;

      hls.on(Hls.Events.ERROR, (_e, data) => {
        console.log('[Player] hls.js error:', data.type, data.details, data.fatal);
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            // hls.js failed — try native playback as fallback
            console.log('[Player] hls.js fatal error, trying direct src fallback');
            hls.destroy();
            hlsRef.current = null;
            tryDirectSrc(video, url);
          }
        }
      });

      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('[Player] HLS manifest parsed, starting playback');
        video.play().catch(() => {});
      });
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari / some Android WebViews)
      console.log('[Player] Using native HLS support');
      video.src = url;
      video.play().catch(() => {});
    } else {
      // Direct file (mp4, ts, mkv) or no HLS support
      console.log('[Player] Direct src playback');
      video.src = url;
      video.play().catch(() => {});
    }

    return () => {
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onVideoError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [state?.url, tryDirectSrc, tryTsFallback]);

  if (!state?.url) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Nenhum stream selecionado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        {state.title && (
          <h1 className="text-foreground text-sm font-medium truncate">{state.title}</h1>
        )}
      </div>

      {/* Video container */}
      <div className="relative w-full bg-black" style={{ height: '35vh' }}>
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls
          playsInline
          // @ts-ignore
          webkit-playsinline=""
          autoPlay
        />

        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
            <p className="text-white/70 text-sm text-center px-6">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerPage;
