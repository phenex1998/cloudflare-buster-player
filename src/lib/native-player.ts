/**
 * Utility functions for platform detection and native fullscreen playback.
 */

export function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

export function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isMobile(): boolean {
  return isAndroid() || isIOS();
}

/**
 * Launch fullscreen video playback via native Capacitor plugin.
 * Returns 'web-fallback' on non-native platforms so the caller can navigate to /player.
 */
export async function playFullscreen(url: string, title?: string): Promise<'ok' | 'web-fallback'> {
  if (!isAndroid() && !isIOS()) {
    return 'web-fallback';
  }

  try {
    const { VideoPlayer } = await import('@capgo/capacitor-video-player');
    await VideoPlayer.stopAllPlayers().catch(() => {});
    await VideoPlayer.initPlayer({
      mode: 'fullscreen',
      url: url.trim(),
      playerId: 'fullscreen-player',
      componentTag: 'div',
      title: title || 'Stream',
      exitOnEnd: true,
      loopOnEnd: false,
      showControls: true,
      displayMode: 'landscape',
      chromecast: false,
    });
    return 'ok';
  } catch (error) {
    console.error('[playFullscreen] Erro ao abrir player:', error);
    return 'web-fallback';
  }
}
