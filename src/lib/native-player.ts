/**
 * Utility functions for platform detection.
 * Playback is now handled entirely inline via PlayerPage + hls.js.
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
