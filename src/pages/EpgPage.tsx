import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi, LiveStream } from '@/lib/xtream-api';
import AppHeader from '@/components/AppHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Radio, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const EpgPage: React.FC = () => {
  const { credentials } = useIptv();
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);

  const { data: streams = [], isLoading: loadingStreams } = useQuery({
    queryKey: ['live-streams-epg', credentials?.host],
    queryFn: () => xtreamApi.getLiveStreams(credentials!),
    enabled: !!credentials,
  });

  const { data: epgData, isLoading: loadingEpg } = useQuery({
    queryKey: ['epg', credentials?.host, selectedStream?.stream_id],
    queryFn: () => xtreamApi.getEpg(credentials!, selectedStream!.stream_id),
    enabled: !!credentials && !!selectedStream,
  });

  const epgListings = epgData?.epg_listings || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="Guia de Programação (EPG)" showSearch={false} />

      <div className="flex h-[calc(100vh-57px-64px)]">
        {/* Channel sidebar */}
        <div className="w-[140px] sm:w-[200px] border-r border-border overflow-y-auto shrink-0">
          {loadingStreams ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-2">
                <Skeleton className="w-8 h-8 rounded" />
                <Skeleton className="h-3 flex-1" />
              </div>
            ))
          ) : (
            streams.map((stream: LiveStream) => (
              <button
                key={stream.stream_id}
                onClick={() => setSelectedStream(stream)}
                className={cn(
                  'w-full flex items-center gap-2 p-2 text-left transition-colors',
                  selectedStream?.stream_id === stream.stream_id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                )}
              >
                {stream.stream_icon ? (
                  <img src={stream.stream_icon} alt="" className="w-7 h-7 rounded object-contain bg-muted shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded bg-muted flex items-center justify-center shrink-0">
                    <Radio className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
                <span className="text-xs truncate">{stream.name}</span>
              </button>
            ))
          )}
        </div>

        {/* EPG listings */}
        <div className="flex-1 overflow-y-auto p-4">
          {!selectedStream ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Clock className="w-10 h-10 mb-2" />
              <p className="text-sm">Selecione um canal para ver a programação</p>
            </div>
          ) : loadingEpg ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : epgListings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center mt-10">Nenhuma programação disponível</p>
          ) : (
            <div className="space-y-2">
              {epgListings.map((item, idx) => {
                const now = Date.now() / 1000;
                const isLive = Number(item.start_timestamp) <= now && Number(item.stop_timestamp) >= now;
                return (
                  <div
                    key={idx}
                    className={cn(
                      'p-3 rounded-lg border',
                      isLive ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {isLive && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(item.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {atob(item.title)}
                    </p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {atob(item.description)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EpgPage;
