import React, { useState, useMemo, forwardRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi, LiveStream } from '@/lib/xtream-api';
import { playFullscreen } from '@/lib/native-player';
import IconSidebar from '@/components/IconSidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VirtuosoGrid } from 'react-virtuoso';

const gridComponents = {
  List: forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ style, children, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      style={style}
      className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 p-4 items-start"
    >
      {children}
    </div>
  )),
  Item: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>
      {children}
    </div>
  ),
};

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

  const handlePlay = async (stream: LiveStream) => {
    if (!credentials) return;
    const url = xtreamApi.getLiveStreamUrl(credentials, stream.stream_id, 'ts');
    addToHistory({ id: stream.stream_id, type: 'live', name: stream.name, icon: stream.stream_icon });

    const result = await playFullscreen(url, stream.name);
    if (result === 'web-fallback') {
      navigate('/player', { state: { url, title: stream.name, type: 'live' } });
    }
  };

  const renderChannel = (index: number) => {
    const stream = filteredStreams[index];
    if (!stream) return null;
    return (
      <button
        key={stream.stream_id}
        onClick={() => handlePlay(stream)}
        className="bg-[hsl(var(--card))] rounded-xl border border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all flex flex-col overflow-hidden"
      >
        <div className="relative w-full aspect-video bg-[#1e1e1e] flex items-center justify-center overflow-hidden">
          {stream.stream_icon ? (
            <>
              <img
                src={stream.stream_icon}
                alt=""
                className="absolute inset-0 w-full h-full object-contain transition-opacity duration-300"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  (e.currentTarget.nextElementSibling as HTMLElement)?.style.removeProperty('display');
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center" style={{ display: 'none' }}>
                <Radio className="w-8 h-8 text-muted-foreground" />
              </div>
            </>
          ) : (
            <Radio className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <div className="p-2">
          <p className="text-[11px] text-center text-foreground truncate">{stream.name}</p>
        </div>
      </button>
    );
  };

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
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 p-4 items-start">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-video rounded-xl" />
              ))}
            </div>
          ) : (
            <VirtuosoGrid
              totalCount={filteredStreams.length}
              overscan={200}
              components={gridComponents}
              itemContent={renderChannel}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveTvSplitPage;
