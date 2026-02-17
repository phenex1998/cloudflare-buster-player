import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi, LiveStream, Category } from '@/lib/xtream-api';
import AppHeader from '@/components/AppHeader';
import VideoPlayerModal from '@/components/VideoPlayerModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

const LiveTvPage: React.FC = () => {
  const { credentials, toggleFavorite, isFavorite, addToHistory } = useIptv();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['live-categories', credentials?.host],
    queryFn: () => xtreamApi.getLiveCategories(credentials!),
    enabled: !!credentials,
  });

  const { data: streams = [], isLoading } = useQuery({
    queryKey: ['live-streams', credentials?.host, selectedCategory],
    queryFn: () => xtreamApi.getLiveStreams(credentials!, selectedCategory === 'all' ? undefined : selectedCategory),
    enabled: !!credentials,
  });

  const playStream = (stream: LiveStream) => {
    setActiveStream(stream);
    addToHistory({ id: stream.stream_id, type: 'live', name: stream.name, icon: stream.stream_icon });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="TV ao Vivo" />

      {/* Modal player overlay */}
      {activeStream && credentials && (
        <VideoPlayerModal
          url={xtreamApi.getLiveStreamUrl(credentials, activeStream.stream_id)}
          title={activeStream.name}
          onClose={() => setActiveStream(null)}
        />
      )}

      {/* Categories */}
      <div className="px-4 py-3 overflow-x-auto flex gap-2 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('all')}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
            selectedCategory === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          Todos
        </button>
        {categories.map((cat: Category) => (
          <button
            key={cat.category_id}
            onClick={() => setSelectedCategory(cat.category_id)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
              selectedCategory === cat.category_id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {cat.category_name}
          </button>
        ))}
      </div>

      {/* Channel list */}
      <div className="px-4 space-y-1">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))
        ) : (
          streams.map((stream: LiveStream) => (
            <button
              key={stream.stream_id}
              onClick={() => playStream(stream)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                activeStream?.stream_id === stream.stream_id
                  ? 'bg-primary/10 border border-primary/20'
                  : 'hover:bg-muted'
              )}
            >
              {stream.stream_icon ? (
                <img
                  src={stream.stream_icon}
                  alt={stream.name}
                  className="w-10 h-10 rounded-lg object-contain bg-muted"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Radio className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{stream.name}</p>
              </div>
              {activeStream?.stream_id === stream.stream_id && (
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              )}
              <button
                onClick={e => {
                  e.stopPropagation();
                  toggleFavorite({ id: stream.stream_id, type: 'live', name: stream.name, icon: stream.stream_icon });
                }}
                className="p-1"
              >
                <Heart className={cn('w-4 h-4', isFavorite(stream.stream_id, 'live') ? 'fill-primary text-primary' : 'text-muted-foreground')} />
              </button>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveTvPage;
