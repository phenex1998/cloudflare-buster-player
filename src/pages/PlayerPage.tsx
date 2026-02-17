import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { ArrowLeft, Loader2, Maximize, Minimize } from 'lucide-react';

interface PlayerState {
  url: string;
  title?: string;
}

const PlayerPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const state = location.state as PlayerState | undefined;

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  useEffect(() => {
    if (!state?.url) return;

    let cancelled = false;
    const isNative = Capacitor.isNativePlatform();

    const startPlayer = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isNative) {
          const cleanUrl = state.url.trim();
          console.log('[Player] URL:', cleanUrl);

          const { VideoPlayer } = await import('@capgo/capacitor-video-player');

          await VideoPlayer.initPlayer({
            mode: 'embedded',
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

          // initPlayer resolves when the native player closes
          if (!cancelled) {
            navigate(-1);
          }
        } else {
          // Web preview fallback
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
    <div className={isFullscreen ? 'fixed inset-0 bg-black z-50 flex flex-col' : 'min-h-screen bg-background'}>
      {/* Player container */}
      <div
        className={
          isFullscreen
            ? 'relative w-full h-full bg-black'
            : 'relative w-full bg-black'
        }
        style={!isFullscreen ? { aspectRatio: '16/9' } : undefined}
      >
        {/* Top bar overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-3 flex items-center gap-3">
          <button
            onClick={() => {
              if (isFullscreen) {
                setIsFullscreen(false);
              } else {
                navigate(-1);
              }
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          {state.title && (
            <h1 className="text-white text-sm font-medium truncate flex-1">{state.title}</h1>
          )}
        </div>

        {/* Bottom controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-3 flex items-center justify-end">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title={isFullscreen ? 'Minimizar' : 'Tela cheia'}
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5 text-white" />
            ) : (
              <Maximize className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Loading spinner */}
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        )}

        {/* Container for native plugin */}
        <div id="fullscreen" className="w-full h-full" />

        {/* Error overlay */}
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

      {/* Info section below player (only in inline mode) */}
      {!isFullscreen && (
        <div className="px-4 py-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{state.title || 'Reproduzindo'}</h2>
            <p className="text-sm text-muted-foreground mt-1">Transmissão ao vivo</p>
          </div>
          <div className="h-px bg-border" />
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Informações</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Use o botão de tela cheia para expandir o player. Pressione voltar para retornar à lista de canais.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerPage;
