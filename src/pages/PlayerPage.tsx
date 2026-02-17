import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
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

  useEffect(() => {
    if (!state?.url) return;

    let cancelled = false;
    const isNative = Capacitor.isNativePlatform();

    const startPlayer = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isNative) {
          // Dynamically import the plugin only on native
          const { VideoPlayer } = await import('@capgo/capacitor-video-player');

          await VideoPlayer.initPlayer({
            mode: 'fullscreen',
            url: state.url,
            playerId: 'fullscreen',
            componentTag: 'app-root',
            title: state.title || 'Stream',
            exitOnEnd: true,
            loopOnEnd: false,
            showControls: true,
            chromecast: false,
            displayMode: 'landscape',
          });

          // initPlayer resolves when the native player closes
          if (!cancelled) {
            navigate(-1);
          }
        } else {
          // Web preview fallback: open URL directly (won't work for IPTV but avoids crash)
          setLoading(false);
          setError('O player nativo só funciona no app Android. Use o APK instalado no dispositivo.');
        }
      } catch (err: any) {
        console.error('Native player error:', err);
        if (!cancelled) {
          setLoading(false);
          setError(err?.message || 'Erro ao iniciar o player nativo.');
        }
      }
    };

    startPlayer();

    return () => {
      cancelled = true;
      if (isNative) {
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

      {/* Container for native plugin */}
      <div id="fullscreen" className="flex-1" />

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-4">
          <p className="text-white/70 text-sm text-center px-8">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
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
