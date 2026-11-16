import { NextResponse } from "next/server"
import OpenAI from "openai"
import { GUEST_TASTE_NUDGE } from "@/lib/guest-taste-insight"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const preferences = body?.preferences ?? {}
    const likedArtworks = Array.isArray(body?.likedArtworks) ? body.likedArtworks : []

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OpenAI API key" }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey })

    const prompt = `You are Kaleidorium's Kurator. A guest collector has just completed about 10 likes/dislikes on Discover. Give a short, warm insight about their emerging collector taste.

Preference signals (higher score = stronger affinity):
${JSON.stringify(preferences, null, 2)}

Liked / saved artworks so far:
${JSON.stringify(likedArtworks, null, 2)}

Return ONLY a JSON object with:
- "headline": short title (max 8 words)
- "insight": 2 short sentences, address the collector as "you", specific not generic
- "artists": array of 4-5 artist names to explore next. Prefer well-known or notable artists that fit their taste. Artists do NOT need to be on Kaleidorium — recommend freely from the wider art world.
- "nudge": keep close to: "${GUEST_TASTE_NUDGE}"

Be specific about styles, moods, subjects, or palettes visible in the signals. Do not invent artworks they liked.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert art curator writing concise, personal taste insights. Reply with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) {
      return NextResponse.json({ error: "Empty insight response" }, { status: 502 })
    }

    const parsed = JSON.parse(raw)
    return NextResponse.json({
      headline: parsed.headline || "Your collector taste is taking shape",
      insight:
        parsed.insight ||
        "Your early likes and dislikes already outline a clear eye for art.",
      artists: Array.isArray(parsed.artists) ? parsed.artists.slice(0, 5) : [],
      nudge: parsed.nudge || GUEST_TASTE_NUDGE,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[GUEST TASTE INSIGHT]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
