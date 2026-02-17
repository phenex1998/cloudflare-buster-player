import React, { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Maximize, Minimize, Volume2, VolumeX, RotateCcw, ExternalLink, Settings, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

interface HlsPlayerProps {
  url: string;
  title?: string;
  onClose?: () => void;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

const HlsPlayer: React.FC<HlsPlayerProps> = ({ url, title, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [audioTracks, setAudioTracks] = useState<{ id: number; name: string }[]>([]);
  const [activeAudioTrack, setActiveAudioTrack] = useState(0);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => {
        setShowControls(false);
        setShowSettings(false);
      }, 4000);
    }
  }, [playing]);

  // Init HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(null);

    const destroy = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };

    if (url.includes('.m3u8') || url.includes('.m3u')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000,
          fragLoadingMaxRetry: 6,
          manifestLoadingMaxRetry: 4,
          levelLoadingMaxRetry: 4,
          fragLoadingRetryDelay: 1000,
          xhrSetup: (xhr) => {
            xhr.withCredentials = false;
          },
        });

        hls.loadSource(url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          video.play().then(() => setPlaying(true)).catch(() => {});
        });

        hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
          const tracks = hls.audioTracks.map((t, i) => ({
            id: i,
            name: t.name || t.lang || `Faixa ${i + 1}`,
          }));
          setAudioTracks(tracks);
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('[HLS] Network error, attempting recovery...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('[HLS] Media error, attempting recovery...');
                hls.recoverMediaError();
                break;
              default:
                setError('Erro fatal no player. Tente novamente.');
                hls.destroy();
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadeddata', () => {
          setLoading(false);
          video.play().then(() => setPlaying(true)).catch(() => {});
        });
      } else {
        setError('Seu navegador não suporta HLS.');
      }
    } else {
      // Direct .ts or other
      video.src = url;
      video.addEventListener('loadeddata', () => {
        setLoading(false);
        video.play().then(() => setPlaying(true)).catch(() => {});
      });
      video.addEventListener('error', () => {
        setError('Falha ao carregar o stream.');
      });
    }

    return destroy;
  }, [url]);

  // Playback rate
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // Volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
      videoRef.current.muted = muted;
    }
  }, [volume, muted]);

  // Audio track switch
  useEffect(() => {
    if (hlsRef.current && hlsRef.current.audioTracks.length > activeAudioTrack) {
      hlsRef.current.audioTrack = activeAudioTrack;
    }
  }, [activeAudioTrack]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => setPlaying(true));
    } else {
      v.pause();
      setPlaying(false);
    }
    resetHideTimer();
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setFullscreen(false)).catch(() => {});
    }
  };

  const retry = () => {
    setError(null);
    setLoading(true);
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    // Re-trigger by forcing url change won't work, so re-init manually
    const video = videoRef.current;
    if (!video) return;
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        maxBufferLength: 30,
        fragLoadingMaxRetry: 6,
        xhrSetup: (xhr) => { xhr.withCredentials = false; },
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().then(() => setPlaying(true)).catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setError('Erro fatal. Tente player externo.');
      });
      hlsRef.current = hls;
    } else {
      video.src = url;
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn('video-container relative bg-black rounded-xl overflow-hidden', fullscreen && 'fullscreen')}
      onClick={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      <video ref={videoRef} className="w-full h-full object-contain" playsInline />

      {/* Loading */}
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 z-10 p-4">
          <p className="text-sm text-destructive-foreground text-center">{error}</p>
          <div className="flex gap-2">
            <button onClick={retry} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              <RotateCcw className="w-4 h-4" /> Tentar Novamente
            </button>
            <button onClick={() => window.open(url, '_system')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium">
              <ExternalLink className="w-4 h-4" /> Player Externo
            </button>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      {showControls && !error && !loading && (
        <div className="absolute inset-0 z-20 flex flex-col justify-between bg-gradient-to-t from-black/70 via-transparent to-black/40 transition-opacity">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-3">
            {title && <p className="text-sm font-semibold text-white truncate flex-1">{title}</p>}
            {onClose && (
              <button onClick={onClose} className="p-2 rounded-full bg-black/40">
                <X className="w-5 h-5 text-white" />
              </button>
            )}
          </div>

          {/* Center play */}
          <div className="flex items-center justify-center">
            <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
              {playing ? <Pause className="w-7 h-7 text-white" /> : <Play className="w-7 h-7 text-white ml-0.5" />}
            </button>
          </div>

          {/* Bottom bar */}
          <div className="flex items-center gap-3 px-4 pb-3">
            <button onClick={() => setMuted(!muted)} className="p-2">
              {muted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
            </button>
            <div className="w-24">
              <Slider
                value={[muted ? 0 : volume]}
                onValueChange={([v]) => { setVolume(v); if (v > 0) setMuted(false); }}
                max={100}
                step={5}
                className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
              />
            </div>
            <div className="flex-1" />
            <button onClick={() => setShowSettings(!showSettings)} className="p-2">
              <Settings className="w-5 h-5 text-white" />
            </button>
            <button onClick={toggleFullscreen} className="p-2">
              {fullscreen ? <Minimize className="w-5 h-5 text-white" /> : <Maximize className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
      )}

      {/* Settings panel (right side) */}
      {showSettings && (
        <div className="absolute right-0 top-0 bottom-0 w-56 bg-card/95 backdrop-blur-md z-30 p-4 flex flex-col gap-4 border-l border-border overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Configurações</span>
            <button onClick={() => setShowSettings(false)} className="p-1"><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>

          {/* Speed */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Velocidade</p>
            <div className="flex flex-wrap gap-1.5">
              {PLAYBACK_RATES.map(r => (
                <button
                  key={r}
                  onClick={() => setPlaybackRate(r)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                    playbackRate === r ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {r}x
                </button>
              ))}
            </div>
          </div>

          {/* Audio tracks */}
          {audioTracks.length > 1 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Áudio</p>
              <div className="flex flex-col gap-1">
                {audioTracks.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveAudioTrack(t.id)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-md text-xs font-medium text-left transition-colors',
                      activeAudioTrack === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* External */}
          <button
            onClick={() => window.open(url, '_system')}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-muted-foreground hover:text-foreground text-xs mt-auto"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Player Externo
          </button>
        </div>
      )}
    </div>
  );
};

export default HlsPlayer;
