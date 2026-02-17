/**
 * Native video player for Android using @capgo/capacitor-video-player (ExoPlayer).
 * Live streams use the native player; VOD uses Android Intent for external players.
 */

import { VideoPlayer } from '@capgo/capacitor-video-player';

export function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

export function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isMobile(): boolean {
  return isAndroid() || isIOS();
}

function isLiveStream(url: string): boolean {
  const lower = url.toLowerCase();
  return !lower.endsWith('.mp4') && !lower.endsWith('.mkv') && !lower.endsWith('.avi');
}

/**
 * Play a stream using the native CapacitorVideoPlayer (ExoPlayer on Android).
 * Includes a 10s timeout. Throws on failure so the caller can show fallback UI.
 */
export async function playWithNativePlayer(url: string, title?: string): Promise<void> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Player timeout (10s)')), 10000)
  );

  const player = VideoPlayer.initPlayer({
    mode: 'fullscreen',
    url,
    playerId: 'liveplayer',
    componentTag: 'app-liveplayer',
    title: title || '',
    rate: 1.0,
    exitOnEnd: false,
    loopOnEnd: true,
    pipEnabled: true,
    showControls: true,
    displayMode: 'landscape',
  });

  await Promise.race([player, timeout]);
}

/**
 * Opens a video stream via Android Intent (VLC/MX Player/external player).
 */
export function playWithExternalPlayer(url: string, title?: string): void {
  if (isAndroid()) {
    const stripped = url.replace(/^https?:\/\//, '');
    const scheme = url.startsWith('https') ? 'https' : 'http';

    let intentUrl = `intent://${stripped}#Intent;scheme=${scheme};type=video/*`;
    if (title) {
      intentUrl += `;S.title=${encodeURIComponent(title)}`;
    }
    intentUrl += ';end';

    try {
      window.location.href = intentUrl;
    } catch {
      try {
        window.open(url, '_system');
      } catch {
        window.location.href = url;
      }
    }
  } else {
    window.open(url, '_blank');
  }
}

/**
 * Main entry point for playing streams.
 * - Live streams → native player (ExoPlayer) with 10s timeout
 * - VOD → external player via Intent
 */
export async function playStream(url: string, title?: string): Promise<{ fallback: boolean }> {
  if (isLiveStream(url)) {
    try {
      await playWithNativePlayer(url, title);
      return { fallback: false };
    } catch {
      return { fallback: true };
    }
  } else {
    playWithExternalPlayer(url, title);
    return { fallback: false };
  }
}
