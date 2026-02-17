import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { isAndroid } from '@/lib/native-player';

const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/iptv-proxy`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** On web (preview), route requests through proxy to avoid CORS/mixed-content. On Android WebView, use direct URLs. */
function proxyUrl(url: string): string {
  if (isAndroid()) return url;
  return `${PROXY_BASE}?url=${encodeURIComponent(url)}`;
}

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
    if (!state?.url || !videoRef.current) return;

    const video = videoRef.current;
    const url = state.url;
    const isHlsStream = url.includes('.m3u8') || url.includes('/live/');
    const onAndroid = isAndroid();

    if (isHlsStream && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        ...(onAndroid
          ? {}
          : {
              // On web, proxy all XHR requests through edge function
              xhrSetup: (xhr: XMLHttpRequest, requestUrl: string) => {
                const proxied = proxyUrl(requestUrl);
                xhr.open('GET', proxied, true);
                xhr.setRequestHeader('apikey', ANON_KEY);
              },
            }),
      });

      hlsRef.current = hls;
      hls.loadSource(onAndroid ? url : proxyUrl(url));
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Try to recover once
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setLoading(false);
              setError('Erro ao carregar o stream. Verifique sua conexão.');
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari / some WebViews)
      video.src = onAndroid ? url : proxyUrl(url);
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        video.play().catch(() => {});
      });
    } else {
      // Direct playback (mp4, mkv, etc.)
      video.src = onAndroid ? url : proxyUrl(url);
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
        setLoading(false);
        setError('Formato não suportado ou URL inválida.');
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [state?.url]);

  if (!state?.url) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/70">Nenhum stream selecionado.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Top bar */}
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

      {/* Loading */}
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

      {/* Video */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        autoPlay
        playsInline
      />

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-4">
          <p className="text-white/70 text-sm text-center px-8">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                // Re-trigger by remounting
                window.location.reload();
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
