import React, { useRef, useEffect, useCallback, useState } from 'react';
import Hls from 'hls.js';
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

const native = isAndroid();

function getProxiedUrl(url: string): string {
  if (native) return url;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/iptv-proxy?url=${encodeURIComponent(url)}`;
}

const InlinePlayer: React.FC<InlinePlayerProps> = ({ url, title, streamId, streamType = 'live', streamIcon }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const { toggleFavorite, isFavorite } = useIptv();
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

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

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        xhrSetup: native ? undefined : (xhr, reqUrl) => {
          const proxied = getProxiedUrl(reqUrl);
          xhr.open('GET', proxied, true);
        },
      });
      hlsRef.current = hls;
      hls.loadSource(native ? cleanUrl : playUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.warn('[InlinePlayer] HLS error:', data.type, data.details);
        if (data.fatal) {
          console.log('[InlinePlayer] Fatal HLS error, trying direct src');
          hls.destroy();
          hlsRef.current = null;
          video.src = playUrl;
          video.load();
          video.play().catch(() => {});
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = playUrl;
      video.load();
      video.play().catch(() => {});
    } else {
      video.src = playUrl;
      video.load();
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url]);

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
        }).catch((e: unknown) => console.error('[InlinePlayer] fullscreen error:', e));
      });
    } else {
      videoRef.current?.requestFullscreen?.();
    }
  }, [native, currentUrl, title]);

  const fav = streamId !== undefined && isFavorite(streamId, streamType);

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 bg-black flex items-center justify-center min-h-0">
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
