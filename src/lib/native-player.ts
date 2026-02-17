import { Capacitor } from '@capacitor/core';

/**
 * Opens a video stream using the device's default video player (VLC, MX Player, etc.)
 * via Android Intent ACTION_VIEW. No proxy, no plugin — direct .ts URL.
 * Falls back to window.open on web.
 */
export function playStream(url: string, _title?: string): void {
  if (Capacitor.isNativePlatform()) {
    // Android/iOS: open via system intent — launches external player (VLC, MX Player, default)
    window.open(url, '_system');
  } else {
    // Web fallback: open in new tab
    window.open(url, '_blank');
  }
}
