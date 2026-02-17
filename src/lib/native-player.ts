/**
 * Platform detection and native video player utilities.
 * Uses User Agent detection instead of Capacitor.isNativePlatform()
 * because the latter returns false when loading from a remote URL.
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
 * Opens a video stream in an external player (VLC, MX Player, etc.).
 * On Android: uses intent:// URI to launch the system app chooser.
 * On iOS/Web: opens in a new tab (system handles video natively).
 */
export function playStream(url: string, _title?: string): void {
  if (isAndroid()) {
    // Build Android Intent URI to open in external video player
    // Format: intent://HOST/path#Intent;scheme=http;type=video/*;end
    const stripped = url.replace(/^https?:\/\//, '');
    const scheme = url.startsWith('https') ? 'https' : 'http';
    const intentUrl = `intent://${stripped}#Intent;scheme=${scheme};type=video/*;end`;

    try {
      window.location.href = intentUrl;
    } catch {
      // Fallback: try _system open
      try {
        window.open(url, '_system');
      } catch {
        // Last resort: direct navigation
        window.location.href = url;
      }
    }
  } else {
    // iOS & Web: open in new tab, system handles video
    window.open(url, '_blank');
  }
}
