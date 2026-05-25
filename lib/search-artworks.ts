import { supabase } from "@/lib/supabase"
import type { Artwork } from "@/types/artwork"

export function transformSupabaseArtwork(artwork: Record<string, unknown>): Artwork {
  return {
    id: String(artwork.id),
    title: (artwork.artwork_title as string) || "",
    artist: (artwork.artist as string) || "",
    medium: (artwork.medium as string) || "",
    dimensions: (artwork.dimensions as string) || "",
    year: (artwork.year as string) || "",
    price: (artwork.price as string) || "",
    currency: (artwork.currency as string) || undefined,
    description: (artwork.description as string) || "",
    tags: (artwork.tags as string[]) || [],
    artwork_image: (artwork.artwork_image as string) || "",
    created_at: (artwork.created_at as string) || "",
    updated_at: (artwork.updated_at as string) || "",
    link: (artwork.artwork_link as string) || (artwork.link as string) || undefined,
    style: (artwork.style as string) || undefined,
    genre: (artwork.genre as string) || undefined,
    subject: (artwork.subject as string) || undefined,
    colour: (artwork.colour as string) || undefined,
  }
}

function relevanceScore(artwork: Artwork, term: string): number {
  const t = term.toLowerCase()
  const title = (artwork.title || "").toLowerCase()
  const artist = (artwork.artist || "").toLowerCase()
  const style = (artwork.style || "").toLowerCase()
  const subject = (artwork.subject || "").toLowerCase()
  const colour = (artwork.colour || "").toLowerCase()

  let score = 0
  if (title === t) score += 100
  else if (title.includes(t)) score += 50

  if (artist === t) score += 90
  else if (artist.includes(t)) score += 40

  if (style.includes(t)) score += 20
  if (subject.includes(t)) score += 15
  if (colour.includes(t)) score += 10

  return score
}

/** Case-insensitive partial match across artist, title, style, subject, colour. */
export async function searchArtworks(
  query: string
): Promise<{ results: Artwork[]; error: string | null }> {
  const term = query.trim()
  if (!term) return { results: [], error: null }

  const safe = term.replace(/[%_,]/g, " ").trim()
  if (!safe) return { results: [], error: null }

  const pattern = `%${safe}%`

  const { data, error } = await supabase
    .from("Artwork")
    .select("*")
    .or(
      `artwork_title.ilike.${pattern},artist.ilike.${pattern},style.ilike.${pattern},subject.ilike.${pattern},colour.ilike.${pattern}`
    )
    .limit(50)

  if (error) {
    console.error("Search artworks error:", error)
    return { results: [], error: "Could not load search results. Please try again." }
  }

  const results = (data || []).map((row) =>
    transformSupabaseArtwork(row as Record<string, unknown>)
  )
  const ranked = results.sort(
    (a, b) => relevanceScore(b, safe) - relevanceScore(a, safe)
  )

  return { results: ranked, error: null }
}
