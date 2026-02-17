import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIptv } from '@/contexts/IptvContext';
import { xtreamApi, EpgListing } from '@/lib/xtream-api';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface EpgSectionProps {
  streamId: number;
  channelName: string;
}

const EpgSection: React.FC<EpgSectionProps> = ({ streamId, channelName }) => {
  const { credentials } = useIptv();
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['epg', streamId],
    queryFn: () => xtreamApi.getEpg(credentials!, streamId),
    enabled: !!credentials && expanded,
    staleTime: 5 * 60 * 1000,
  });

  const listings = data?.epg_listings || [];
  const now = Math.floor(Date.now() / 1000);
  const current = listings.find(l => Number(l.start_timestamp) <= now && Number(l.stop_timestamp) > now);
  const upcoming = listings.filter(l => Number(l.start_timestamp) > now).slice(0, 3);

  const formatTime = (ts: string) => {
    const d = new Date(Number(ts) * 1000);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">
            EPG — {channelName}
          </span>
          {current && !expanded && (
            <span className="text-xs text-muted-foreground truncate ml-1">
              • {decodeHtml(current.title)}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)
          ) : listings.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Nenhum dado de EPG disponível.</p>
          ) : (
            <>
              {current && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-destructive text-destructive-foreground uppercase">Agora</span>
                    <span className="text-xs text-muted-foreground">{formatTime(current.start_timestamp)} – {formatTime(current.stop_timestamp)}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{decodeHtml(current.title)}</p>
                  {current.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{decodeHtml(current.description)}</p>
                  )}
                </div>
              )}
              {upcoming.map(l => (
                <div key={l.id} className="p-3 rounded-lg bg-muted/50">
                  <span className="text-xs text-muted-foreground">{formatTime(l.start_timestamp)} – {formatTime(l.stop_timestamp)}</span>
                  <p className="text-sm font-medium text-foreground">{decodeHtml(l.title)}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

function decodeHtml(html: string): string {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

export default EpgSection;
