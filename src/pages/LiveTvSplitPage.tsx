import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi, LiveStream } from '@/lib/xtream-api';
import { playFullscreen } from '@/lib/native-player';
import IconSidebar from '@/components/IconSidebar';
import ChannelCard from '@/components/ChannelCard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { Loader2 } from 'lucide-react';

const LiveTvSplitPage: React.FC = () => {
  const { credentials, addToHistory } = useIptv();
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['live-categories', credentials?.host],
    queryFn: () => xtreamApi.getLiveCategories(credentials!),
    enabled: !!credentials,
  });

  const { data: allStreams = [], isLoading } = useQuery({
    queryKey: ['live-streams-all', credentials?.host],
    queryFn: () => xtreamApi.getLiveStreams(credentials!),
    enabled: !!credentials,
  });

  const filteredStreams = useMemo(() => {
    if (!selectedCategoryId) return allStreams;
    return allStreams.filter(s => s.category_id === selectedCategoryId);
  }, [allStreams, selectedCategoryId]);

  const { limit, sentinelRef, hasMore } = useInfiniteScroll(filteredStreams.length);

  const handlePlay = useCallback(async (stream: LiveStream) => {
    if (!credentials) return;
    const url = xtreamApi.getLiveStreamUrl(credentials, stream.stream_id, 'ts');
    addToHistory({ id: stream.stream_id, type: 'live', name: stream.name, icon: stream.stream_icon });

    const result = await playFullscreen(url, stream.name);
    if (result === 'web-fallback') {
      navigate('/player', { state: { url, title: stream.name, type: 'live' } });
    }
  }, [credentials, addToHistory, navigate]);

  return (
    <div className="w-full h-full flex overflow-hidden">
      <IconSidebar />

      {/* Categories */}
      <div className="w-[200px] h-full flex flex-col border-r border-border bg-card/30 shrink-0">
        <div className="px-3 py-2.5 border-b border-border">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Categorias</h2>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={cn(
              'w-full text-left px-3 py-2 text-sm transition-colors',
              selectedCategoryId === null
                ? 'bg-primary/15 text-primary border-l-2 border-primary font-semibold'
                : 'text-foreground hover:bg-muted/40'
            )}
          >
            Tudo ({allStreams.length})
          </button>
          {categories.map(cat => {
            const count = allStreams.filter(s => s.category_id === cat.category_id).length;
            return (
              <button
                key={cat.category_id}
                onClick={() => setSelectedCategoryId(cat.category_id)}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm transition-colors',
                  selectedCategoryId === cat.category_id
                    ? 'bg-primary/15 text-primary border-l-2 border-primary font-semibold'
                    : 'text-foreground hover:bg-muted/40'
                )}
              >
                {cat.category_name}
                <span className="text-muted-foreground text-xs ml-1">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of channel cards */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Canais ({filteredStreams.length})
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-4">
          {isLoading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3" style={{ contentVisibility: 'auto' }}>
                {filteredStreams.slice(0, limit).map(stream => (
                  <ChannelCard
                    key={stream.stream_id}
                    name={stream.name}
                    icon={stream.stream_icon}
                    onClick={() => handlePlay(stream)}
                  />
                ))}
              </div>
              {hasMore && (
                <div ref={sentinelRef} className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveTvSplitPage;
