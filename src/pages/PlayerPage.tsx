import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { ArrowLeft, Loader2, Maximize, Search, X, Heart, Radio } from 'lucide-react';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi, LiveStream, Category } from '@/lib/xtream-api';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import EpgSection from '@/components/EpgSection';

interface PlayerState {
  url: string;
  title?: string;
  streamId?: number;
}

const PlayerPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { credentials, toggleFavorite, isFavorite, addToHistory } = useIptv();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStream, setCurrentStream] = useState<PlayerState | undefined>(
    location.state as PlayerState | undefined
  );
  const [search, setSearch] = useState('');
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const isNative = Capacitor.isNativePlatform();

  // Fetch categories & streams for the channel list below
  const { data: categories = [] } = useQuery({
    queryKey: ['live-categories', credentials?.host],
    queryFn: () => xtreamApi.getLiveCategories(credentials!),
    enabled: !!credentials,
  });

  const { data: allStreams = [] } = useQuery({
    queryKey: ['live-streams-all', credentials?.host],
    queryFn: () => xtreamApi.getLiveStreams(credentials!),
    enabled: !!credentials,
  });

  const categoryMap = useMemo(() => {
    const map = new Map<string, { category: Category; streams: LiveStream[] }>();
    categories.forEach(cat => map.set(cat.category_id, { category: cat, streams: [] }));
    allStreams.forEach(s => {
      const entry = map.get(s.category_id);
      if (entry) entry.streams.push(s);
    });
    return map;
  }, [categories, allStreams]);

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim();
    const entries = Array.from(categoryMap.values()).filter(e => e.streams.length > 0);
    if (!q) return entries;
    return entries
      .map(e => ({
        ...e,
        streams: e.streams.filter(s => s.name.toLowerCase().includes(q)),
      }))
      .filter(e => e.streams.length > 0);
  }, [categoryMap, search]);

  // Start / switch embedded player
  const startPlayer = useCallback(async (streamState: PlayerState) => {
    if (!isNative) {
      setLoading(false);
      setError('O player nativo só funciona no app Android. Use o APK instalado no dispositivo.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const cleanUrl = streamState.url.trim();
      console.log('[Player] Embedded URL:', cleanUrl);

      const { VideoPlayer } = await import('@capgo/capacitor-video-player');

      // Stop any previous player
      await VideoPlayer.stopAllPlayers().catch(() => {});

      // Get container dimensions
      const container = videoContainerRef.current;
      const width = container?.clientWidth || 360;
      const height = container?.clientHeight || 250;

      await VideoPlayer.initPlayer({
        mode: 'embedded',
        url: cleanUrl,
        playerId: 'video-player-div',
        componentTag: 'div',
        title: streamState.title || 'Stream',
        width,
        height,
        exitOnEnd: false,
        loopOnEnd: false,
        showControls: true,
        chromecast: false,
      });

      setLoading(false);
    } catch (err: any) {
      console.error('Native player error:', err);
      setLoading(false);
      setError(err?.message || 'Erro ao iniciar o player nativo.');
    }
  }, [isNative]);

  // Init player on mount or stream change
  useEffect(() => {
    if (!currentStream?.url) return;
    startPlayer(currentStream);

    return () => {
      if (isNative) {
        import('@capgo/capacitor-video-player').then(({ VideoPlayer }) => {
          VideoPlayer.stopAllPlayers().catch(() => {});
        }).catch(() => {});
      }
    };
  }, [currentStream?.url]);

  // Switch channel
  const handlePlay = (stream: LiveStream) => {
    if (!credentials) return;
    addToHistory({ id: stream.stream_id, type: 'live', name: stream.name, icon: stream.stream_icon });
    const url = xtreamApi.getLiveStreamUrl(credentials, stream.stream_id, 'ts');
    setCurrentStream({ url, title: stream.name, streamId: stream.stream_id });
  };

  // Fullscreen toggle
  const goFullscreen = async () => {
    if (!isNative || !currentStream?.url) return;
    try {
      const { VideoPlayer } = await import('@capgo/capacitor-video-player');
      await VideoPlayer.stopAllPlayers().catch(() => {});
      await VideoPlayer.initPlayer({
        mode: 'fullscreen',
        url: currentStream.url.trim(),
        playerId: 'iptvPlayer',
        componentTag: 'div',
        title: currentStream.title || 'Stream',
        exitOnEnd: true,
        loopOnEnd: false,
        showControls: true,
        displayMode: 'landscape',
        chromecast: false,
      });
      // When fullscreen closes, restart embedded
      startPlayer(currentStream);
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  if (!currentStream?.url) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Nenhum stream selecionado.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top: Video Area */}
      <div className="relative bg-black shrink-0" style={{ height: '35vh' }} ref={videoContainerRef}>
        {/* Native plugin target div */}
        <div id="video-player-div" className="w-full h-full" />

        {/* Overlay controls */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => {
                if (isNative) {
                  import('@capgo/capacitor-video-player').then(({ VideoPlayer }) => {
                    VideoPlayer.stopAllPlayers().catch(() => {});
                  }).catch(() => {});
                }
                navigate(-1);
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            {currentStream.title && (
              <h1 className="text-white text-xs font-medium truncate">{currentStream.title}</h1>
            )}
          </div>
          <button
            onClick={goFullscreen}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Maximize className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Loading spinner */}
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center z-5">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-3 z-20">
            <p className="text-white/70 text-xs text-center px-6">{error}</p>
            <div className="flex gap-2">
              <button
                onClick={() => currentStream && startPlayer(currentStream)}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-medium"
              >
                Tentar novamente
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
              >
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* EPG for current channel */}
      {currentStream.streamId && (
        <div className="px-4 pt-3">
          <EpgSection streamId={currentStream.streamId} channelName={currentStream.title || ''} />
        </div>
      )}

      {/* Bottom: Channel list */}
      <div className="flex-1 overflow-y-auto">
        {/* Search */}
        <div className="px-4 pt-3 pb-2 sticky top-0 bg-background z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar canais..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Channel grid */}
        <div className="px-4 pb-6 space-y-5">
          {filteredCategories.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">Nenhum canal encontrado.</p>
          ) : (
            filteredCategories.map(({ category, streams }) => (
              <section key={category.category_id}>
                <h2 className="text-xs font-bold text-foreground tracking-wide uppercase mb-2">
                  {category.category_name}
                </h2>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {streams.map(stream => {
                    const isActive = currentStream.streamId === stream.stream_id;
                    return (
                      <button
                        key={stream.stream_id}
                        onClick={() => handlePlay(stream)}
                        className={cn(
                          'group relative flex flex-col items-center rounded-lg overflow-hidden transition-all',
                          'bg-card border hover:shadow-md',
                          isActive
                            ? 'border-primary ring-1 ring-primary shadow-md shadow-primary/10'
                            : 'border-border hover:border-primary/40'
                        )}
                      >
                        <div className="absolute top-1 left-1 z-10">
                          <Badge variant="destructive" className="px-1 py-0 text-[8px] leading-3 font-bold rounded-sm">
                            LIVE
                          </Badge>
                        </div>

                        <button
                          onClick={e => {
                            e.stopPropagation();
                            toggleFavorite({ id: stream.stream_id, type: 'live', name: stream.name, icon: stream.stream_icon });
                          }}
                          className="absolute top-1 right-1 z-10 p-0.5 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Heart className={cn('w-2.5 h-2.5', isFavorite(stream.stream_id, 'live') ? 'fill-primary text-primary' : 'text-white/70')} />
                        </button>

                        <div className="w-full aspect-square flex items-center justify-center p-2 bg-muted/30">
                          {stream.stream_icon ? (
                            <img
                              src={stream.stream_icon}
                              alt={stream.name}
                              className="max-w-full max-h-full object-contain"
                              loading="lazy"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <Radio className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>

                        <div className="w-full px-1 py-1.5 bg-card">
                          <p className="text-[10px] font-medium text-foreground truncate text-center leading-tight">
                            {stream.name}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerPage;
