import React, { useRef, useEffect, useCallback, useState } from 'react';
import mpegts from 'mpegts.js';
import { Maximize, Heart, Radio, AlertTriangle } from 'lucide-react';
import { useIptv } from '@/contexts/IptvContext';
import { cn } from '@/lib/utils';
import { isAndroid } from '@/lib/native-player';

interface InlinePlayerProps {
  url: string | null;
  title: string;
  streamId?: number | string;
  streamType?: 'live' | 'vod' | 'series';
  streamIcon?: string;
}

const native = isAndroid();

function getProxiedUrl(url: string): string {
  if (native) return url;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/iptv-proxy?url=${encodeURIComponent(url)}`;
}

const InlinePlayer: React.FC<InlinePlayerProps> = ({ url, title, streamId, streamType = 'live', streamIcon }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<mpegts.Player | null>(null);
  const { toggleFavorite, isFavorite } = useIptv();
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // Cleanup helper
  const destroyPlayer = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.unload();
        playerRef.current.detachMediaElement();
        playerRef.current.destroy();
      } catch (e) {
        console.warn('[InlinePlayer] cleanup error:', e);
      }
      playerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Destroy previous player
    destroyPlayer();
    setPlayerError(null);

    if (!url) {
      video.removeAttribute('src');
      video.load();
      setCurrentUrl(null);
      return;
    }

    const cleanUrl = url.trim();
    setCurrentUrl(cleanUrl);
    const playUrl = getProxiedUrl(cleanUrl);

    console.log('[InlinePlayer] Loading:', cleanUrl, native ? '(direct)' : '(proxied)');

    // Regra 2: Atraso de segurança — esperar 200ms para garantir DOM pronto
    const timer = setTimeout(() => {
      try {
        const isTsStream = cleanUrl.toLowerCase().endsWith('.ts') || streamType === 'live';

        if (isTsStream && mpegts.isSupported()) {
          console.log('[InlinePlayer] Initializing mpegts.js player');
          const player = mpegts.createPlayer({
            type: 'mpegts',
            isLive: streamType === 'live',
            url: playUrl,
          }, {
            enableWorker: true,
            liveBufferLatencyChasing: streamType === 'live',
            liveBufferLatencyMaxLatency: 1.5,
            liveBufferLatencyMinRemain: 0.3,
          });

          playerRef.current = player;
          player.attachMediaElement(video);
          player.load();

          const playResult = player.play();
          if (playResult && typeof playResult.catch === 'function') {
            playResult.catch((e: unknown) => {
              console.warn('[InlinePlayer] play() rejected:', e);
            });
          }

          // Regra 3: Tratamento de erro com feedback visual
          player.on(mpegts.Events.ERROR, (errorType: string, errorDetail: string, errorInfo: unknown) => {
            const msg = `mpegts error: ${errorType} - ${errorDetail}`;
            console.error('[InlinePlayer]', msg, errorInfo);
            setPlayerError(msg);

            // Fallback: tentar <video src> direto
            console.log('[InlinePlayer] Fallback: direct video src');
            destroyPlayer();
            video.src = playUrl;
            video.load();
            video.play().catch(() => {});
          });
        } else {
          // Fallback: direct src for VOD (.mp4, .mkv, etc.) or unsupported browsers
          console.log('[InlinePlayer] Using direct video src (no mpegts)');
          video.src = playUrl;
          video.load();
          video.play().catch(() => {});
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : JSON.stringify(err);
        console.error('[InlinePlayer] Init error:', errMsg);
        setPlayerError('Erro ao iniciar player: ' + errMsg);

        // Fallback direto
        try {
          video.src = playUrl;
          video.load();
          video.play().catch(() => {});
        } catch (fallbackErr) {
          console.error('[InlinePlayer] Fallback also failed:', fallbackErr);
        }

        if (native) {
          alert('Erro ao iniciar player: ' + errMsg);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      destroyPlayer();
    };
  }, [url, destroyPlayer, streamType]);

  const handleFullscreen = useCallback(() => {
    if (native && currentUrl) {
      import('@capgo/capacitor-video-player').then(({ VideoPlayer }) => {
        VideoPlayer.initPlayer({
          mode: 'fullscreen',
          url: currentUrl,
          playerId: 'fullscreenPlayer',
          title: title || 'Stream',
          exitOnEnd: true,
          loopOnEnd: false,
          showControls: true,
          displayMode: 'landscape',
          chromecast: false,
        }).catch((e: unknown) => {
          const msg = e instanceof Error ? e.message : JSON.stringify(e);
          console.error('[InlinePlayer] fullscreen error:', msg);
          alert('Erro fullscreen: ' + msg);
        });
      });
    } else {
      videoRef.current?.requestFullscreen?.();
    }
  }, [currentUrl, title]);

  const fav = streamId !== undefined && isFavorite(streamId, streamType);

  return (
    <div className="flex flex-col h-full">
      {/* Regra 1: Dimensões explícitas + borda vermelha de diagnóstico */}
      <div
        className="relative flex-1 bg-black flex items-center justify-center min-h-0"
        style={{ minHeight: '300px', border: '1px solid red' }}
      >
        {url ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              controls={false}
            />
            <button
              onClick={handleFullscreen}
              className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-colors z-10"
              title="Tela cheia"
            >
              <Maximize className="w-5 h-5" />
            </button>
            {/* Regra 3: Erro visível na UI */}
            {playerError && (
              <div className="absolute bottom-3 left-3 right-3 p-2 bg-destructive/90 text-destructive-foreground rounded-lg text-xs flex items-center gap-2 z-10">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="truncate">{playerError}</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Radio className="w-12 h-12 opacity-30" />
            <p className="text-sm">Selecione um canal para assistir</p>
          </div>
        )}
      </div>

      {url && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-card/80 border-t border-border shrink-0">
          {streamIcon && (
            <img src={streamIcon} alt="" className="w-8 h-8 rounded object-contain bg-muted" />
          )}
          <span className="text-sm font-medium text-foreground flex-1 truncate">{title}</span>
          {streamId !== undefined && (
            <button
              onClick={() => toggleFavorite({ id: streamId, type: streamType, name: title, icon: streamIcon })}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Heart className={cn('w-4 h-4', fav ? 'fill-primary text-primary' : 'text-muted-foreground')} />
            </button>
          )}
          <button
            onClick={handleFullscreen}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default InlinePlayer;
