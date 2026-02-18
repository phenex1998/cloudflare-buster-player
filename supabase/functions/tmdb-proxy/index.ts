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
    const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
    if (!TMDB_API_KEY) {
      return new Response(JSON.stringify({ error: 'TMDB_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { query, tmdb_id } = await req.json();
    const BASE = 'https://api.themoviedb.org/3';
    const headers = { Authorization: `Bearer ${TMDB_API_KEY}`, 'Content-Type': 'application/json' };

    let movieId = tmdb_id;

    // If no tmdb_id, search by name
    if (!movieId && query) {
      const searchRes = await fetch(
        `${BASE}/search/movie?query=${encodeURIComponent(query)}&language=pt-BR&page=1`,
        { headers }
      );
      const searchData = await searchRes.json();
      if (!searchData.results?.length) {
        return new Response(JSON.stringify({ found: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      movieId = searchData.results[0].id;
    }

    if (!movieId) {
      return new Response(JSON.stringify({ found: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch movie details + credits in parallel
    const [detailsRes, creditsRes] = await Promise.all([
      fetch(`${BASE}/movie/${movieId}?language=pt-BR`, { headers }),
      fetch(`${BASE}/movie/${movieId}/credits?language=pt-BR`, { headers }),
    ]);

    const details = await detailsRes.json();
    const credits = await creditsRes.json();

    const director = credits.crew?.find((c: any) => c.job === 'Director')?.name || '';
    const cast = credits.cast?.slice(0, 8).map((c: any) => c.name).join(', ') || '';

    const result = {
      found: true,
      id: details.id,
      title: details.title,
      original_title: details.original_title,
      overview: details.overview,
      release_date: details.release_date,
      runtime: details.runtime,
      vote_average: details.vote_average,
      genres: details.genres?.map((g: any) => g.name) || [],
      backdrop_path: details.backdrop_path ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}` : null,
      poster_path: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null,
      director,
      cast,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
