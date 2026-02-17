import { VideoPlayer as CapacitorVideoPlayer } from '@capgo/capacitor-video-player';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

/**
 * Opens a video stream in fullscreen using the native ExoPlayer (Android)
 * or AVPlayer (iOS). Falls back to window.open on web.
 */
export async function playStream(url: string, title?: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await CapacitorVideoPlayer.initPlayer({
        mode: 'fullscreen',
        url,
        playerId: 'player1',
        componentTag: 'div',
        title: title || '',
        smallTitle: '',
        accentColor: '#FF0000',
        chromecast: false,
        pipEnabled: false,
        bkmodeEnabled: true,
        showControls: true,
        displayMode: 'all',
        exitOnEnd: true,
        loopOnEnd: false,
      });
    } catch (err) {
      console.error('[NativePlayer] initPlayer failed:', err);
      toast.error('Erro ao abrir player nativo. Tentando player externo...');
      window.open(url, '_system');
    }
  } else {
    window.open(url, '_blank');
  }
}
