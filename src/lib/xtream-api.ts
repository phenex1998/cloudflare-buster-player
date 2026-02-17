// Xtream Codes API Service

export interface XtreamCredentials {
  host: string;
  username: string;
  password: string;
}

export interface XtreamAuthInfo {
  user_info: {
    username: string;
    password: string;
    status: string;
    exp_date: string;
    is_trial: string;
    active_cons: string;
    created_at: string;
    max_connections: string;
    allowed_output_formats: string[];
  };
  server_info: {
    url: string;
    port: string;
    https_port: string;
    server_protocol: string;
    rtmp_port: string;
    timezone: string;
    timestamp_now: number;
    time_now: string;
  };
}

export interface Category {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface LiveStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

export interface VodStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  rating: string;
  rating_5based: number;
  added: string;
  category_id: string;
  container_extension: string;
  custom_sid: string;
  direct_source: string;
}

export interface SeriesInfo {
  num: number;
  name: string;
  series_id: number;
  cover: string;
  plot: string;
  cast: string;
  director: string;
  genre: string;
  releaseDate: string;
  last_modified: string;
  rating: string;
  rating_5based: number;
  backdrop_path: string[];
  youtube_trailer: string;
  episode_run_time: string;
  category_id: string;
}

export interface SeriesDetail {
  seasons: Array<{
    air_date: string;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    season_number: number;
    cover: string;
    cover_big: string;
  }>;
  info: SeriesInfo;
  episodes: Record<string, Array<{
    id: string;
    episode_num: number;
    title: string;
    container_extension: string;
    info: {
      duration_secs: number;
      duration: string;
      plot: string;
      rating: number;
    };
    season: number;
    direct_source: string;
  }>>;
}

export interface EpgListing {
  id: string;
  epg_id: string;
  title: string;
  lang: string;
  start: string;
  end: string;
  description: string;
  channel_id: string;
  start_timestamp: string;
  stop_timestamp: string;
}

function baseUrl(creds: XtreamCredentials): string {
  let host = creds.host.trim();
  if (!host.startsWith('http')) host = `http://${host}`;
  if (host.endsWith('/')) host = host.slice(0, -1);
  return host;
}

function apiUrl(creds: XtreamCredentials, action?: string): string {
  const base = baseUrl(creds);
  let url = `${base}/player_api.php?username=${encodeURIComponent(creds.username)}&password=${encodeURIComponent(creds.password)}`;
  if (action) url += `&action=${action}`;
  return url;
}

// Detect if running inside Capacitor native app
function isNative(): boolean {
  return !!(window as any).Capacitor;
}

// Fetch via proxy (web) or direct (native)
async function fetchApi<T>(url: string): Promise<T> {
  if (isNative()) {
    // Native: direct fetch (no CORS issues)
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json();
  } else {
    // Web: route through edge function proxy to bypass CORS
    const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/iptv-proxy`;
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      throw new Error(`Proxy error: ${res.status} ${res.statusText} ${errorBody}`);
    }
    return res.json();
  }
}

export const xtreamApi = {
  authenticate: (creds: XtreamCredentials) =>
    fetchApi<XtreamAuthInfo>(apiUrl(creds)),

  getLiveCategories: (creds: XtreamCredentials) =>
    fetchApi<Category[]>(apiUrl(creds, 'get_live_categories')),

  getLiveStreams: (creds: XtreamCredentials, categoryId?: string) => {
    let url = apiUrl(creds, 'get_live_streams');
    if (categoryId) url += `&category_id=${categoryId}`;
    return fetchApi<LiveStream[]>(url);
  },

  getVodCategories: (creds: XtreamCredentials) =>
    fetchApi<Category[]>(apiUrl(creds, 'get_vod_categories')),

  getVodStreams: (creds: XtreamCredentials, categoryId?: string) => {
    let url = apiUrl(creds, 'get_vod_streams');
    if (categoryId) url += `&category_id=${categoryId}`;
    return fetchApi<VodStream[]>(url);
  },

  getSeriesCategories: (creds: XtreamCredentials) =>
    fetchApi<Category[]>(apiUrl(creds, 'get_series_categories')),

  getSeries: (creds: XtreamCredentials, categoryId?: string) => {
    let url = apiUrl(creds, 'get_series');
    if (categoryId) url += `&category_id=${categoryId}`;
    return fetchApi<SeriesInfo[]>(url);
  },

  getSeriesInfo: (creds: XtreamCredentials, seriesId: number) =>
    fetchApi<SeriesDetail>(apiUrl(creds, 'get_series_info') + `&series_id=${seriesId}`),

  getEpg: (creds: XtreamCredentials, streamId: number) =>
    fetchApi<{ epg_listings: EpgListing[] }>(apiUrl(creds, 'get_short_epg') + `&stream_id=${streamId}`),

  getFullEpg: (creds: XtreamCredentials, streamId: number) =>
    fetchApi<{ epg_listings: EpgListing[] }>(apiUrl(creds, 'get_simple_data_table') + `&stream_id=${streamId}`),

  getLiveStreamUrl: (creds: XtreamCredentials, streamId: number, ext = 'ts') =>
    `${baseUrl(creds)}/live/${encodeURIComponent(creds.username)}/${encodeURIComponent(creds.password)}/${streamId}.${ext}`,

  getVodStreamUrl: (creds: XtreamCredentials, streamId: number, ext: string) =>
    `${baseUrl(creds)}/movie/${encodeURIComponent(creds.username)}/${encodeURIComponent(creds.password)}/${streamId}.${ext}`,

  getSeriesStreamUrl: (creds: XtreamCredentials, streamId: string, ext: string) =>
    `${baseUrl(creds)}/series/${encodeURIComponent(creds.username)}/${encodeURIComponent(creds.password)}/${streamId}.${ext}`,
};
