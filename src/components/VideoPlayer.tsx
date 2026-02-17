import React from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { playStream } from '@/lib/native-player';

interface VideoPlayerProps {
  url: string;
  title?: string;
  onBack?: () => void;
}

/**
 * Lightweight component that launches the native fullscreen player (ExoPlayer/AVPlayer)
 * via capacitor-video-player. On web, it opens the stream in a new tab.
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title }) => {
  const handlePlay = () => {
    playStream(url, title);
  };

  return (
    <div className="relative bg-muted rounded-lg overflow-hidden aspect-video flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handlePlay}
          className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground active:scale-95 transition-transform shadow-lg"
        >
          <Play className="w-7 h-7 ml-0.5" />
        </button>
        {title && (
          <p className="text-sm font-medium text-foreground text-center px-4 truncate max-w-full">
            {title}
          </p>
        )}
        <button
          onClick={() => window.open(url, '_system')}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Abrir em player externo
        </button>
      </div>
    </div>
  );
};

export default VideoPlayer;
