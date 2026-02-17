import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { ArrowLeft } from 'lucide-react';

interface PlayerState {
  url: string;
  title?: string;
}

const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/iptv-proxy`;
const isNative = Capacitor.isNativePlatform();

const resolveUrl = (url: string) => {
  if (isNative) return url;
  return `${PROXY_BASE}?url=${encodeURIComponent(url)}`;
};

const PlayerPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const state = location.state as PlayerState | undefined;

  useEffect(() => {
    if (!state?.url) return;
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(null);

    const streamUrl = state.url.trim();
    const finalUrl = resolveUrl(streamUrl);
    setResolvedUrl(finalUrl);

    console.log("🎥 Player NATIVO iniciado - URL recebida:", streamUrl);
    console.log("📱 Plataforma:", isNative ? "Android/iOS (direto)" : "Web (com proxy)");
    console.log("🔗 URL resolvida:", finalUrl);

    video.src = finalUrl;
    video.load();
    video.muted = true;
    console.log("✅ video.src definido e load() chamado");

    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(err => console.error("❌ Auto-play falhou:", err));
    }

    const timeoutId = setTimeout(() => {
      console.warn("⏰ Timeout 10s atingido");
      setLoading(false);
      setError("Stream demorou demais. Tente 'Forçar Reprodução'");
    }, 10000);

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
          {/* Botão de teste temporário */}
          <button
            onClick={() => {
              const video = videoRef.current;
              if (video) {
                video.src = "https://test-streams.mux.dev/x264/1080p.m3u8";
                video.load();
                video.play();
                setLoading(true);
                setError(null);
                setResolvedUrl("https://test-streams.mux.dev/x264/1080p.m3u8");
              }
            }}
            className="ml-auto text-xs bg-blue-600 px-3 py-1 rounded text-white"
          >
            Testar HLS Público
          </button>
        </div>

        <video
          ref={videoRef}
          className="w-full h-full bg-black object-contain rounded-2xl"
          playsInline
          webkit-playsinline="true"
          muted
          autoPlay
          controls
          crossOrigin="anonymous"
          onLoadStart={() => console.log("onLoadStart")}
          onLoadedData={() => { console.log("✅ onLoadedData"); setLoading(false); }}
          onLoadedMetadata={() => { console.log("✅ onLoadedMetadata"); setLoading(false); }}
          onCanPlay={() => { console.log("✅ onCanPlay"); setLoading(false); }}
          onPlaying={() => { console.log("✅✅ onPlaying - VÍDEO RODANDO!"); setLoading(false); }}
          onWaiting={() => console.log("⏳ onWaiting")}
          onStalled={() => console.warn("⚠️ onStalled")}
          onError={(e) => {
            console.error("❌ VIDEO ERROR:", e);
            setLoading(false);
            setError("Erro no stream");
          }}
        />

        {/* Loading overlay com debug visível */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
            <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mb-4" />
            <p className="text-white mb-2">Carregando stream...</p>

            {/* DEBUG VISÍVEL */}
            <div className="bg-zinc-900 p-4 rounded-xl text-left text-xs text-zinc-400 max-w-[90%] font-mono">
              <div>Plataforma: {isNative ? 'NATIVE (direto)' : 'WEB (proxy)'}</div>
              <div>URL: {resolvedUrl?.slice(0, 80)}...</div>
              <div>ReadyState: {videoRef.current?.readyState ?? '0'}</div>
              <div>Network: {videoRef.current?.networkState ?? '0'}</div>
            </div>

            <button
              onClick={() => {
                const video = videoRef.current;
                if (video) {
                  video.play().catch(e => alert("Play error: " + e.message));
                }
              }}
              className="mt-6 px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold"
            >
              FORÇAR REPRODUÇÃO
            </button>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-3 z-20">
            <p className="text-white/70 text-xs text-center px-6">{error}</p>
            <button
              onClick={() => {
                const video = videoRef.current;
                if (video) {
                  video.play().catch(e => alert("Play error: " + e.message));
                }
              }}
              className="px-6 py-2 rounded-lg bg-green-600 text-white text-xs font-medium"
            >
              Forçar Reprodução
            </button>
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
