import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Hls from 'hls.js';

// Proxy URL para resolver CORS no preview web — usa a Edge Function iptv-proxy
const IPTV_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/iptv-proxy`;

interface PlayerState {
  url: string;
  title?: string;
}

const PlayerPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const state = location.state as PlayerState | undefined;

  useEffect(() => {
    if (!state?.url) return;

    let cancelled = false;
    const isNative = Capacitor.isNativePlatform();

    const startPlayer = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isNative) {
          // ---- Player nativo Android (ExoPlayer via Capacitor) ----
          const cleanUrl = state.url.trim();
          console.log('[Player] Native URL:', cleanUrl);

          const { VideoPlayer } = await import('@capgo/capacitor-video-player');

          await VideoPlayer.initPlayer({
            mode: 'fullscreen',
            url: cleanUrl,
            playerId: 'iptvPlayer',
            componentTag: 'div',
            title: state.title || 'Stream',
            exitOnEnd: true,
            loopOnEnd: false,
            showControls: true,
            displayMode: 'landscape',
            chromecast: false,
          });

          if (!cancelled) {
            navigate(-1);
          }
        } else {
          // ---- Player inline web (hls.js via proxy CORS) ----
          const video = videoRef.current;
          if (!video) return;

          // Passa a URL pelo proxy para resolver CORS no preview web
          const proxiedUrl = `${IPTV_PROXY_URL}?url=${encodeURIComponent(state.url.trim())}`;
          console.log('🎥 Carregando stream via proxy:', proxiedUrl);

          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
            });
            hlsRef.current = hls;

            hls.loadSource(proxiedUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (!cancelled) {
                setLoading(false);
                video.play().catch(() => {});
              }
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
              console.error('❌ HLS ERROR:', data.type, data.details, data);
              if (data.fatal && !cancelled) {
                setLoading(false);
                setError(`Erro HLS: ${data.details}`);
                hls.destroy();
              }
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari nativo com suporte HLS
            video.src = proxiedUrl;
            video.addEventListener('loadedmetadata', () => {
              if (!cancelled) {
                setLoading(false);
                video.play().catch(() => {});
              }
            });
          } else {
            setLoading(false);
            setError('Seu navegador não suporta HLS.');
          }
        }
      } catch (err: any) {
        console.error('Player error:', err);
        if (!cancelled) {
          setLoading(false);
          setError(err?.message || 'Erro ao iniciar o player.');
        }
      }
    };

    startPlayer();

    return () => {
      cancelled = true;
      // Cleanup hls.js
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      // Cleanup native player
      if (Capacitor.isNativePlatform()) {
        import('@capgo/capacitor-video-player').then(({ VideoPlayer }) => {
          VideoPlayer.stopAllPlayers().catch(() => {});
        }).catch(() => {});
      }
    };
  }, [state?.url]);

  if (!state?.url) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Nenhum stream selecionado.</p>
      </div>
    );
  }

  const isNative = Capacitor.isNativePlatform();

  // No modo nativo, mostra tela cheia com loading
  if (isNative) {
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
        <div id="fullscreen" className="flex-1" />
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-4">
            <p className="text-white/70 text-sm text-center px-8">{error}</p>
            <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              Voltar
            </button>
          </div>
        )}
      </div>
    );
  }

  // Modo inline web — player hls.js dentro da página
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        {state.title && (
          <h1 className="text-foreground text-sm font-medium truncate">{state.title}</h1>
        )}
      </div>

      {/* Player inline — 35vh, acima da lista de canais */}
      <div className="relative w-full h-[35vh] min-h-[220px] bg-black rounded-xl overflow-hidden mx-auto">
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        )}

        <video
          ref={videoRef}
          playsInline
          webkit-playsinline="true"
          muted
          autoPlay
          controls
          crossOrigin="anonymous"
          className="w-full h-full object-contain"
        />

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-4 z-20">
            <p className="text-white/70 text-sm text-center px-8">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
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
    </div>
  );
};

export default PlayerPage;
