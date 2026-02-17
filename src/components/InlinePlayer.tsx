import React, { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { X, Loader2, Maximize, Minimize } from 'lucide-react';

interface InlinePlayerProps {
  url: string;
  title?: string;
  onClose: () => void;
}

const InlinePlayer: React.FC<InlinePlayerProps> = ({ url, title, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  useEffect(() => {
    if (!url) return;

    let cancelled = false;
    const isNative = Capacitor.isNativePlatform();

    const startPlayer = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isNative) {
          const cleanUrl = url.trim();
          console.log('[Player] URL:', cleanUrl);

          const { VideoPlayer } = await import('@capgo/capacitor-video-player');

          await VideoPlayer.initPlayer({
            mode: 'embedded',
            url: cleanUrl,
            playerId: 'iptvPlayer',
            componentTag: 'div',
            title: title || 'Stream',
            exitOnEnd: true,
            loopOnEnd: false,
            showControls: true,
            displayMode: 'landscape',
            chromecast: false,
          });

          if (!cancelled) {
            setLoading(false);
          }
        } else {
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
  }, [url]);

  return (
    <div className={isFullscreen ? 'fixed inset-0 bg-black z-50 flex flex-col' : 'w-full'}>
      <div
        className={
          isFullscreen
            ? 'relative w-full flex-1 bg-black'
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
                onClose();
              }
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          {title && (
            <h1 className="text-white text-sm font-medium truncate flex-1">{title}</h1>
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
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info section below player (only in inline mode) */}
      {!isFullscreen && (
        <div className="px-4 py-3 bg-card border-b border-border">
          <h2 className="text-sm font-bold text-foreground">{title || 'Reproduzindo'}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Transmissão ao vivo</p>
        </div>
      )}
    </div>
  );
};

export default InlinePlayer;
