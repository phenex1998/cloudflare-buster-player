import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GET: proxy stream URLs (used by HLS.js and <video> element)
    if (req.method === 'GET') {
      const reqUrl = new URL(req.url);
      const targetUrl = reqUrl.searchParams.get('url');

      if (!targetUrl) {
        return new Response(
          JSON.stringify({ error: 'Missing url query parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(targetUrl);
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const body = await response.arrayBuffer();

      // For .m3u8 playlists, rewrite internal URLs to also go through the proxy
      if (targetUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('text/plain')) {
        const text = new TextDecoder().decode(body);
        // Check if it looks like an HLS playlist
        if (text.includes('#EXTM3U') || text.includes('#EXT-X-')) {
          const baseStreamUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
          const proxyBase = reqUrl.origin + reqUrl.pathname;
          
          const rewritten = text.replace(/^(?!#)(.+\.ts.*)$/gm, (line: string) => {
            const absoluteUrl = line.startsWith('http') ? line : baseStreamUrl + line;
            return `${proxyBase}?url=${encodeURIComponent(absoluteUrl)}`;
          });

          return new Response(rewritten, {
            status: response.status,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/vnd.apple.mpegurl',
              'Cache-Control': 'no-cache',
            },
          });
        }
      }

      return new Response(body, {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Cache-Control': 'no-cache',
        },
      });
    }

    // POST: proxy API calls (existing behavior)
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(url);
    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
