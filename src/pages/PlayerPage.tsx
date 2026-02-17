import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const state = location.state as PlayerState | undefined;

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const initPlayer = useCallback((streamState: PlayerState) => {
    const video = videoRef.current;
    if (!video || !streamState.url) return;

    setLoading(true);
    setError(null);

    // destruir instância anterior
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // reset completo do elemento video
    video.pause();
    video.removeAttribute('src');
    video.load();

    // usar proxy obrigatoriamente
    const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/iptv-proxy`;
    const streamUrl = `${PROXY_BASE}?url=${encodeURIComponent(streamState.url)}`;

    // FORÇAR uso exclusivo do hls.js
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      backBufferLength: 90,
      maxBufferLength: 60,
      maxMaxBufferLength: 120,
      startLevel: -1,
      capLevelToPlayerSize: true,
      manifestLoadingTimeOut: 20000,
      manifestLoadingMaxRetry: 6,
      levelLoadingTimeOut: 20000,
      levelLoadingMaxRetry: 6,
      fragLoadingTimeOut: 20000,
      fragLoadingMaxRetry: 6,
    });

    hlsRef.current = hls;

    hls.attachMedia(video);

    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      hls.loadSource(streamUrl);
    });

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setLoading(false);
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    });

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          setError('Erro ao reproduzir canal');
          hls.destroy();
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!state?.url) return;

    initPlayer(state);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [state?.url, initPlayer]);

  if (!state?.url) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Nenhum stream selecionado.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        {state.title && (
          <h1 className="text-white text-sm font-medium truncate">{state.title}</h1>
        )}
      </div>

      {loading && !error && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        autoPlay
        muted
        controls
        playsInline
        disablePictureInPicture
        controlsList="nofullscreen nodownload noremoteplayback"
      />

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-4">
          <p className="text-white/70 text-sm text-center px-8">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (state) initPlayer(state);
              }}
              className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium"
            >
              Tentar novamente
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerPage;
