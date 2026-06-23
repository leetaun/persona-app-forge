import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5000) {
    return cachedToken.value;
  }
  const id = Deno.env.get('SPOTIFY_CLIENT_ID');
  const secret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
  if (!id || !secret) throw new Error('Missing Spotify credentials');

  const basic = btoa(`${id}:${secret}`);
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Spotify token error: ${res.status} ${txt}`);
  }
  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let q = url.searchParams.get('q') ?? '';
    if (!q && req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      q = (body?.q ?? '').toString();
    }
    q = q.trim();
    if (!q) {
      return new Response(JSON.stringify({ tracks: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (q.length > 100) q = q.slice(0, 100);

    const token = await getAccessToken();
    const sres = await fetch(
      `https://api.spotify.com/v1/search?type=track&limit=12&market=VN&q=${encodeURIComponent(q)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!sres.ok) {
      const txt = await sres.text();
      throw new Error(`Spotify search error: ${sres.status} ${txt}`);
    }
    const data = await sres.json();
    const tracks = (data?.tracks?.items ?? []).map((t: any) => ({
      id: t.id,
      name: t.name,
      artists: (t.artists ?? []).map((a: any) => a.name).join(', '),
      preview_url: t.preview_url,
      cover: t.album?.images?.[t.album.images.length - 1]?.url ?? null,
      cover_lg: t.album?.images?.[0]?.url ?? null,
      external_url: t.external_urls?.spotify ?? null,
    }));

    return new Response(JSON.stringify({ tracks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('spotify-search error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
