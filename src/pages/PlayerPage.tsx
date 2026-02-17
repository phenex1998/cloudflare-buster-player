import React, { useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !state?.url) return;

    const url = state.url.trim();
    const isHls = url.includes('.m3u8');

    setLoading(true);
    setError(null);

    const onCanPlay = () => setLoading(false);
    video.addEventListener('canplay', onCanPlay);

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            setError('Erro ao carregar o stream.');
            setLoading(false);
          }
        }
      });

      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari / iOS)
      video.src = url;
      video.play().catch(() => {});
    } else {
      // Direct file (mp4, ts, mkv)
      video.src = url;
      video.play().catch(() => {});
    }

    video.addEventListener('error', () => {
      setError('Erro ao reproduzir o vídeo.');
      setLoading(false);
    });

    return () => {
      video.removeEventListener('canplay', onCanPlay);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [state?.url]);

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
