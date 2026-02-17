import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Search, X, Heart, Radio } from 'lucide-react';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi, LiveStream, Category } from '@/lib/xtream-api';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import EpgSection from '@/components/EpgSection';
import Hls from 'hls.js';

interface PlayerState {
  url: string;
  title?: string;
  streamId?: number;
  isLive?: boolean;
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Memoized categories and streams (Sem alterações aqui, sua lógica estava boa)
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
      .map(e => ({ ...e, streams: e.streams.filter(s => s.name.toLowerCase().includes(q)) }))
      .filter(e => e.streams.length > 0);
  }, [categoryMap, search]);

  // FUNÇÃO DE INICIALIZAÇÃO CORRIGIDA
  const initPlayer = useCallback((streamState: PlayerState) => {
    const video = videoRef.current;
    if (!video || !streamState.url) return;

    setLoading(true);
    setError(null);

    // Limpeza profunda de instâncias anteriores
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    video.pause();
    video.removeAttribute('src');
    video.load();

    const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/iptv-proxy`;
    const url = `${PROXY_BASE}?url=${encodeURIComponent(streamState.url)}`;
    
    // Configuração robusta para IPTV (HLS)
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        maxBufferLength: 30,
        manifestLoadingMaxRetry: 5,
        levelLoadingMaxRetry: 5,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        },
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(e => console.error("Autoplay preventivo:", e));
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setError("Erro fatal de reprodução. Tente outro canal.");
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } 
    // Suporte Nativo (iOS/Safari)
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        video.play().catch(() => {});
      }, { once: true });
    }
  }, []);

  useEffect(() => {
    if (currentStream?.url) {
      initPlayer(currentStream);
    }
  }, [currentStream?.url, initPlayer]);

  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  const handlePlay = (stream: LiveStream) => {
    if (!credentials) return;
    addToHistory({ id: stream.stream_id, type: 'live', name: stream.name, icon: stream.stream_icon });
    const url = xtreamApi.getLiveStreamUrl(credentials, stream.stream_id, 'm3u8');
    setCurrentStream({ url, title: stream.name, streamId: stream.stream_id, isLive: true });
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* AREA DO VIDEO FIXA NO TOPO */}
      <div className="relative w-full bg-black shrink-0" style={{ height: '35vh', minHeight: '220px' }}>
        <video 
          ref={videoRef} 
          className="w-full h-full object-contain z-0" 
          playsInline 
          muted 
          autoPlay
          controls
        />

        {/* Overlay de carregamento e erro */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {loading && !error && (
            <div className="w-full h-full flex items-center justify-center bg-black/20">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          {error && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/90 pointer-events-auto gap-3">
              <p className="text-white/70 text-xs px-6 text-center">{error}</p>
              <button 
                onClick={() => currentStream && initPlayer(currentStream)}
                className="bg-primary text-white px-4 py-2 rounded-lg text-xs"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>

        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent flex items-center gap-3 z-20">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/10 text-white">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-white text-xs font-bold truncate">{currentStream?.title}</span>
        </div>
      </div>

      {/* EPG E LISTA - AREA SCROLLAVEL */}
      <div className="flex-1 overflow-y-auto bg-background">
        {currentStream?.streamId && (
          <div className="px-4 py-3 border-b border-border/50">
            <EpgSection streamId={currentStream.streamId} channelName={currentStream.title || ''} />
          </div>
        )}

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar canais..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm"
            />
          </div>

          <div className="space-y-6">
            {filteredCategories.map(({ category, streams }) => (
              <section key={category.category_id}>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">
                  {category.category_name}
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {streams.map(stream => (
                    <button
                      key={stream.stream_id}
                      onClick={() => handlePlay(stream)}
                      className={cn(
                        "flex flex-col items-center p-2 rounded-xl border transition-all",
                        currentStream?.streamId === stream.stream_id 
                          ? "bg-primary/10 border-primary" 
                          : "bg-card border-transparent"
                      )}
                    >
                      <div className="w-full aspect-square bg-muted/20 rounded-lg flex items-center justify-center mb-1.5 overflow-hidden">
                        {stream.stream_icon ? (
                          <img src={stream.stream_icon} className="w-full h-full object-contain p-1" alt="" />
                        ) : (
                          <Radio className="w-5 h-5 text-muted-foreground/50" />
                        )}
                      </div>
                      <span className="text-[9px] font-medium truncate w-full text-center">
                        {stream.name}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerPage;
