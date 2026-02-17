import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi, LiveStream, Category } from '@/lib/xtream-api';
import IconSidebar from '@/components/IconSidebar';
import InlinePlayer from '@/components/InlinePlayer';
import { Skeleton } from '@/components/ui/skeleton';
import { Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

const LiveTvSplitPage: React.FC = () => {
  const { credentials, addToHistory } = useIptv();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);

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

  const handleSelectStream = (stream: LiveStream) => {
    setActiveStream(stream);
    addToHistory({ id: stream.stream_id, type: 'live', name: stream.name, icon: stream.stream_icon });
  };

  const streamUrl = activeStream && credentials
    ? xtreamApi.getLiveStreamUrl(credentials, activeStream.stream_id, 'ts')
    : null;

  return (
    <div className="w-full h-full flex overflow-hidden">
      <IconSidebar />

      {/* Categories */}
      <div className="w-[20%] h-full flex flex-col border-r border-border bg-card/30 shrink-0">
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

      {/* Channels */}
      <div className="w-[30%] h-full flex flex-col border-r border-border bg-card/20 shrink-0">
        <div className="px-3 py-2.5 border-b border-border">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Canais ({filteredStreams.length})
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2">
                <Skeleton className="w-8 h-8 rounded" />
                <Skeleton className="h-3 flex-1" />
              </div>
            ))
          ) : (
            filteredStreams.map((stream, idx) => (
              <button
                key={stream.stream_id}
                onClick={() => handleSelectStream(stream)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors',
                  activeStream?.stream_id === stream.stream_id
                    ? 'bg-primary/15 border-l-2 border-primary'
                    : 'hover:bg-muted/30'
                )}
              >
                <span className="text-[10px] text-muted-foreground w-5 text-right shrink-0">{idx + 1}</span>
                <div className="w-7 h-7 rounded bg-muted/40 flex items-center justify-center shrink-0 overflow-hidden">
                  {stream.stream_icon ? (
                    <img src={stream.stream_icon} alt="" className="w-full h-full object-contain" loading="lazy" />
                  ) : (
                    <Radio className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
                <span className="text-xs text-foreground truncate">{stream.name}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Player */}
      <div className="flex-1 h-full">
        <InlinePlayer
          url={streamUrl}
          title={activeStream?.name || ''}
          streamId={activeStream?.stream_id}
          streamType="live"
          streamIcon={activeStream?.stream_icon}
        />
      </div>
    </div>
  );
};

export default LiveTvSplitPage;
