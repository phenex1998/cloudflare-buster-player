import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import Hls from 'hls.js';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Cleanup HLS on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
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
          // Web: use <video> + Hls.js
          const video = videoRef.current;
          if (!video) return;

          const cleanUrl = url.trim();
          console.log('[Player Web] URL:', cleanUrl);

          const isHls = cleanUrl.includes('.m3u8') || cleanUrl.includes('.ts') || cleanUrl.includes('/live/');

          if (isHls && Hls.isSupported()) {
            // Destroy previous instance
            if (hlsRef.current) {
              hlsRef.current.destroy();
            }

            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
            });
            hlsRef.current = hls;

            hls.loadSource(cleanUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (!cancelled) {
                setLoading(false);
                video.play().catch(() => {});
              }
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
              console.error('[HLS Error]', data);
              if (data.fatal && !cancelled) {
                setLoading(false);
                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                  setError('Erro de rede ao carregar o stream. Verifique a conexão.');
                } else {
                  setError('Erro ao reproduzir o stream.');
                }
              }
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl') || !isHls) {
            // Native HLS (Safari) or direct video file (mp4, mkv etc.)
            video.src = cleanUrl;
            video.addEventListener('loadeddata', () => {
              if (!cancelled) {
                setLoading(false);
                video.play().catch(() => {});
              }
            }, { once: true });
            video.addEventListener('error', () => {
              if (!cancelled) {
                setLoading(false);
                setError('Erro ao reproduzir o vídeo.');
              }
            }, { once: true });
          } else {
            setLoading(false);
            setError('Formato de vídeo não suportado neste navegador.');
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
      if (isNative) {
        import('@capgo/capacitor-video-player').then(({ VideoPlayer }) => {
          VideoPlayer.stopAllPlayers().catch(() => {});
        }).catch(() => {});
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
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

        {/* Video element for web playback */}
        {!Capacitor.isNativePlatform() && (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            controls={false}
            autoPlay
          />
        )}

        {/* Container for native plugin */}
        {Capacitor.isNativePlatform() && (
          <div id="fullscreen" className="w-full h-full" />
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-4">
            <p className="text-white/70 text-sm text-center px-8">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              Fechar
            </button>
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
