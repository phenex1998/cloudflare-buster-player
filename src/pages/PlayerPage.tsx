import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface PlayerState {
  url: string;
  title?: string;
}

const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/iptv-proxy`;
const isNative = Capacitor.isNativePlatform();

/** No web/preview usa proxy para CORS; no APK usa URL direta (zero latência) */
const resolveUrl = (url: string) => {
  if (isNative) return url;
  return `${PROXY_BASE}?url=${encodeURIComponent(url)}`;
};

const PlayerPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const state = location.state as PlayerState | undefined;

  useEffect(() => {
    if (!state?.url) return;
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(null);

    const streamUrl = state.url.trim();
    const resolvedUrl = resolveUrl(streamUrl);

    console.log("🎥 Player NATIVO iniciado - URL recebida:", streamUrl);
    console.log("📱 Plataforma:", isNative ? "Android/iOS (direto)" : "Web (com proxy)");
    console.log("🔗 URL resolvida:", resolvedUrl);

    video.src = resolvedUrl;
    video.load();
    video.muted = true;
    console.log("✅ video.src definido e load() chamado");

    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(err => console.error("❌ Auto-play falhou:", err));
    }

    const timeoutId = setTimeout(() => {
      console.warn("⏰ Timeout de 8s - loading travado");
      setLoading(false);
      setError("Stream demorou muito para responder");
    }, 8000);

    return () => {
      clearTimeout(timeoutId);
      video.pause();
      video.src = '';
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
    <div className="min-h-screen bg-background pb-24">
      {/* Video container — sempre inline 35vh */}
      <div className="relative w-full h-[35vh] min-h-[220px] bg-black rounded-2xl overflow-hidden shadow-2xl">
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
          className="w-full h-full bg-black object-contain rounded-2xl"
          playsInline
          webkit-playsinline="true"
          muted
          autoPlay
          controls
          crossOrigin="anonymous"
          onLoadedMetadata={() => {
            console.log("✅ onLoadedMetadata disparado");
            setLoading(false);
          }}
          onCanPlay={() => {
            console.log("✅ onCanPlay disparado - stream pronto");
            setLoading(false);
          }}
          onPlaying={() => {
            console.log("✅ onPlaying disparado - vídeo rodando!");
            setLoading(false);
          }}
          onLoadedData={() => console.log("✅ onLoadedData")}
          onWaiting={() => {
            console.log("⏳ onWaiting - bufferizando");
            setLoading(true);
          }}
          onError={(e) => {
            console.error("❌ Video ERROR:", e);
            setLoading(false);
            setError("Erro ao carregar stream - verifique o console");
          }}
          onStalled={() => console.warn("⚠️ onStalled - stream parou")}
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
