import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { VideoPlayer } from '@capgo/capacitor-video-player';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface PlayerState {
  url: string;
  title?: string;
}

const PLAYER_ID = 'iptvPlayer';

const PlayerPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const state = location.state as PlayerState | undefined;

  useEffect(() => {
    if (!state?.url) return;

    let cancelled = false;

    const startPlayer = async () => {
      try {
        setLoading(true);
        setError(null);

        await VideoPlayer.initPlayer({
          mode: 'fullscreen',
          url: state.url,
          playerId: PLAYER_ID,
          componentTag: 'div',
          title: state.title || 'Stream',
          exitOnEnd: true,
          loopOnEnd: false,
          showControls: true,
          chromecast: false,
          displayMode: 'landscape',
        });

        if (!cancelled) {
          setLoading(false);
          // Player closed (exitOnEnd), go back
          navigate(-1);
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
      VideoPlayer.stopAllPlayers().catch(() => {});
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
      {/* Fallback UI while native player loads or on error */}
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

      {/* Container required by the plugin */}
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
