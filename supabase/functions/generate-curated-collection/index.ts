/**
 * Optional Supabase cron target — delegates to the Next.js cron route so
 * the same OpenAI Kurator assistant (asst_KKXnbPckdCyhE2hUrxCaA9vM) is used.
 *
 * Secrets: SITE_URL (e.g. https://kaleidorium.com), CRON_SECRET
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const siteUrl = Deno.env.get("SITE_URL")?.replace(/\/$/, "")
  const cronSecret = Deno.env.get("CRON_SECRET")
  if (!siteUrl) {
    return new Response(JSON.stringify({ error: "Missing SITE_URL" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (cronSecret) headers.Authorization = `Bearer ${cronSecret}`

    const res = await fetch(`${siteUrl}/api/cron/generate-curated-collection`, {
      method: "POST",
      headers,
    })
    const body = await res.text()
    return new Response(body, {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Proxy failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
