import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Maximize, Heart, Radio } from 'lucide-react';
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

const InlinePlayer: React.FC<InlinePlayerProps> = ({ url, title, streamId, streamType = 'live', streamIcon }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toggleFavorite, isFavorite } = useIptv();
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const native = isAndroid();

  useEffect(() => {
    if (!url) {
      setCurrentUrl(null);
      return;
    }

    const cleanUrl = url.trim();
    setCurrentUrl(cleanUrl);
    console.log('[InlinePlayer] URL:', cleanUrl, '| native:', native);

    if (native) {
      import('@capgo/capacitor-video-player').then(({ VideoPlayer }) => {
        const VP = VideoPlayer;
        VP.stopAllPlayers().catch(() => {});

        setTimeout(() => {
          VP.initPlayer({
            mode: 'embedded',
            url: cleanUrl,
            playerId: 'embeddedPlayer',
            componentTag: 'embedded-player-container',
            title: title || 'Stream',
            exitOnEnd: false,
            loopOnEnd: false,
            showControls: true,
            displayMode: 'landscape',
            chromecast: false,
          }).catch((e: unknown) => console.error('[InlinePlayer] initPlayer error:', e));
        }, 300);
      });
    } else {
      const video = videoRef.current;
      if (video) {
        video.src = cleanUrl;
        video.load();
        video.play().catch(() => {});
      }
    }

    return () => {
      if (native) {
        import('@capgo/capacitor-video-player').then(({ VideoPlayer }) => {
          const VP = VideoPlayer;
          VP.stopAllPlayers().catch(() => {});
        });
      }
    };
  }, [url]);

  const handleFullscreen = useCallback(() => {
    if (native && currentUrl) {
      import('@capgo/capacitor-video-player').then(({ VideoPlayer }) => {
        const VP = VideoPlayer;
        VP.initPlayer({
          mode: 'fullscreen',
          url: currentUrl,
          playerId: 'fullscreenPlayer',
          title: title || 'Stream',
          exitOnEnd: true,
          loopOnEnd: false,
          showControls: true,
          displayMode: 'landscape',
          chromecast: false,
        }).catch((e: unknown) => console.error('[InlinePlayer] fullscreen error:', e));
      });
    } else {
      videoRef.current?.requestFullscreen?.();
    }
  }, [native, currentUrl, title]);

  const fav = streamId !== undefined && isFavorite(streamId, streamType);

  return (
    <div className="flex flex-col h-full">
      {/* Player area */}
      <div
        id="embedded-player-container"
        className="relative flex-1 bg-black flex items-center justify-center min-h-0"
        style={{ width: '100%', height: '100%' }}
      >
        {url ? (
          <>
            {!native && (
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                autoPlay
                playsInline
                controls={false}
              />
            )}
            <button
              onClick={handleFullscreen}
              className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-colors z-10"
              title="Tela cheia"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Radio className="w-12 h-12 opacity-30" />
            <p className="text-sm">Selecione um canal para assistir</p>
          </div>
        )}
      </div>

      {/* Info bar */}
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
