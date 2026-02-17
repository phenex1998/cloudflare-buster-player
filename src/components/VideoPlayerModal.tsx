import React, { useRef, useEffect } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { X } from 'lucide-react';

interface VideoPlayerModalProps {
  url: string;
  title?: string;
  onClose: () => void;
}

/**
 * Modal overlay player using Video.js with overrideNative: true.
 * This forces MSE/VHS playback instead of native <video> handling,
 * preventing Android WebView from hijacking the stream URL.
 */
const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ url, title, onClose }) => {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);

  useEffect(() => {
    if (!videoContainerRef.current) return;

    // Create video element dynamically (Video.js requirement)
    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-big-play-centered', 'vjs-fill');
    videoContainerRef.current.appendChild(videoElement);

    // Determine source type
    const isHlsLike = url.includes('/live/') || /\.(m3u8?|m3u|ts)(\?.*)?$/i.test(url);
    const sourceType = isHlsLike ? 'application/x-mpegURL' : 'video/mp4';

    const player = videojs(videoElement, {
      autoplay: true,
      controls: true,
      fluid: false,
      fill: true,
      responsive: true,
      preload: 'auto',
      html5: {
        vhs: {
          overrideNative: false,
        },
        nativeAudioTracks: true,
        nativeVideoTracks: true,
      },
      sources: [{
        src: url,
        type: sourceType,
      }],
    });

    player.ready(() => {
      console.log('[VideoPlayerModal] Video.js ready, source:', url, 'type:', sourceType);
    });

    // If .m3u8 fails for a live .ts URL, try direct .ts with forced type
    player.on('error', () => {
      const error = player.error();
      console.warn('[VideoPlayerModal] Playback error:', error);
    });

    playerRef.current = player;

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [url]);

  // Prevent clicks on the modal backdrop from propagating
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onClick={handleBackdropClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 z-10">
        {title && <p className="text-white text-sm font-medium truncate flex-1">{title}</p>}
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white ml-2"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Video.js container */}
      <div className="flex-1 relative" ref={videoContainerRef} />
    </div>
  );
};

export default VideoPlayerModal;
