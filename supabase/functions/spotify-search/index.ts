// Music search via Apple iTunes Search API (free, no auth, returns 30s previews).
// Kept the function name "spotify-search" so the frontend doesn't need to change.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const q = ((body?.q ?? body?.query) ?? "").toString().trim();

    if (!q) {
      return new Response(JSON.stringify({ tracks: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url =
      `https://itunes.apple.com/search?media=music&entity=song&limit=12&term=` +
      encodeURIComponent(q);

    const res = await fetch(url);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`iTunes search error: ${res.status} ${txt}`);
    }
    const data = await res.json();

    const tracks = (data.results ?? [])
      .filter((t: any) => t.previewUrl)
      .map((t: any) => {
        const cover60: string = t.artworkUrl100 ?? t.artworkUrl60 ?? "";
        const cover_lg = cover60.replace("100x100bb", "300x300bb");
        return {
          id: String(t.trackId),
          name: t.trackName,
          artists: t.artistName,
          preview_url: t.previewUrl,
          cover: cover60,
          cover_lg,
          external_url: t.trackViewUrl,
        };
      });

    return new Response(JSON.stringify({ tracks }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("music search error", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
