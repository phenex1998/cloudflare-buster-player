/**
 * Android-only native video player via Intent.
 * Opens streams in external players (VLC, MX Player, Just Player, etc.)
 * using ExoPlayer — same approach as XCIPTV.
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
 * Opens a video stream via Android Intent (ExoPlayer/VLC/MX Player).
 * Falls back to window.open and then direct navigation.
 */
export function playStream(url: string, title?: string): void {
  if (isAndroid()) {
    // Build Android Intent URI for external video player
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
    // Fallback for non-Android
    window.open(url, '_blank');
  }
}
