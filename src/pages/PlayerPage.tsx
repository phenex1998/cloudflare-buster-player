import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import Hls from 'hls.js';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface PlayerState {
  url: string;
  title?: string;
}

const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/iptv-proxy`;
const proxyUrl = (url: string) => `${PROXY_BASE}?url=${encodeURIComponent(url)}`;

const PlayerPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const state = location.state as PlayerState | undefined;
  const isNative = Capacitor.isNativePlatform();

  // Native fullscreen player (Android)
  useEffect(() => {
    if (!state?.url || !isNative) return;

    let cancelled = false;

    const startNative = async () => {
      try {
        setLoading(true);
        setError(null);
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

        if (!cancelled) navigate(-1);
      } catch (err: any) {
        console.error('Native player error:', err);
        if (!cancelled) {
          setLoading(false);
          setError(err?.message || 'Erro ao iniciar o player nativo.');
        }
      }
    };

    startNative();

    return () => {
      cancelled = true;
      import('@capgo/capacitor-video-player').then(({ VideoPlayer }) => {
        VideoPlayer.stopAllPlayers().catch(() => {});
      }).catch(() => {});
    };
  }, [state?.url, isNative]);

  // Web inline player (HLS.js + proxy)
  useEffect(() => {
    if (!state?.url || isNative) return;
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(null);

    const streamUrl = state.url.trim();
    console.log('🎥 Stream URL:', streamUrl);
    console.log('🎥 Proxied URL:', proxyUrl(streamUrl));

    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr, url) => {
          const proxied = proxyUrl(url);
          xhr.open('GET', proxied, true);
        },
      });

      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error('❌ HLS ERROR:', data.type, data.details, data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('🔄 Tentando reconectar...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('🔄 Recuperando erro de mídia...');
              hls.recoverMediaError();
              break;
            default:
              setLoading(false);
              setError('Erro fatal no stream. Verifique a URL.');
              hls.destroy();
              break;
          }
        }
      });

      hls.loadSource(proxyUrl(streamUrl));
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = proxyUrl(streamUrl);
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        video.play().catch(() => {});
      });
    } else {
      setLoading(false);
      setError('Seu navegador não suporta reprodução HLS.');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [state?.url, isNative]);

  if (!state?.url) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Nenhum stream selecionado.</p>
      </div>
    );
  }

  // Native mode: minimal UI (native player handles everything)
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
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              Voltar
            </button>
          </div>
        )}
      </div>
    );
  }

  // Web inline mode
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Video container */}
      <div className="relative w-full h-[35vh] min-h-[220px] bg-black rounded-xl overflow-hidden">
        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          {state.title && (
            <h1 className="text-white text-sm font-medium truncate">{state.title}</h1>
          )}
        </div>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          muted
          autoPlay
          controls
          crossOrigin="anonymous"
        />

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-3 z-20">
            <p className="text-white/70 text-xs text-center px-6">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
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
