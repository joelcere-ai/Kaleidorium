import type { Artwork } from "@/types/artwork"
import { analyzeCollectionForArchetype } from "@/lib/collector-archetypes"

export interface TastePreferences {
  artists: Record<string, number>
  genres: Record<string, number>
  styles: Record<string, number>
  subjects: Record<string, number>
  colors: Record<string, number>
  priceRanges: Record<string, number>
  interactionCount: number
  viewed_artworks: string[]
}

export interface BasicCollectionInsights {
  summary: string
  topArtists: string[]
  topTags: string[]
  priceRange: string
  recommendations: string[]
  preferredMediums: string[]
}

export interface AiTasteInsights {
  summary: string
  aesthetic_profile: string
  collecting_pattern: string
  recommendations: string[]
  explorationSuggestions: string[]
}

export function mapDbArtworkToArtwork(row: Record<string, unknown>): Artwork {
  return {
    id: String(row.id ?? ""),
    title: (row.artwork_title as string) || "Untitled",
    artist: (row.artist as string) || "Unknown Artist",
    medium: (row.medium as string) || "",
    dimensions: (row.dimensions as string) || "",
    year: (row.year as string) || "",
    price: (row.price as string) || "",
    currency: row.currency as string | undefined,
    description: (row.description as string) || "",
    tags: (row.tags as string[]) || [],
    artwork_image: (row.artwork_image as string) || "/placeholder.svg",
    created_at: (row.created_at as string) || "",
    updated_at: (row.updated_at as string) || "",
    link: row.artwork_link as string | undefined,
    style: row.style as string | undefined,
    genre: row.genre as string | undefined,
    subject: row.subject as string | undefined,
    colour: row.colour as string | undefined,
  }
}

export function analyzeCollectionBasic(artworks: Artwork[]): BasicCollectionInsights {
  if (artworks.length === 0) {
    return {
      summary: "Your collection is empty. Add artworks to build your taste profile.",
      topArtists: [],
      topTags: [],
      priceRange: "N/A",
      recommendations: ["Explore works in Discover and like pieces that resonate with you."],
      preferredMediums: [],
    }
  }

  const artistCounts: Record<string, number> = {}
  const tagCounts: Record<string, number> = {}
  const mediumCounts: Record<string, number> = {}
  const prices: number[] = []

  for (const artwork of artworks) {
    if (artwork.artist) artistCounts[artwork.artist] = (artistCounts[artwork.artist] || 0) + 1
    if (artwork.medium) mediumCounts[artwork.medium] = (mediumCounts[artwork.medium] || 0) + 1
    if (artwork.tags?.length) {
      for (const tag of artwork.tags) {
        if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1
      }
    }
    if (artwork.style) tagCounts[artwork.style] = (tagCounts[artwork.style] || 0) + 1
    if (artwork.genre) tagCounts[artwork.genre] = (tagCounts[artwork.genre] || 0) + 1
    if (artwork.subject) tagCounts[artwork.subject] = (tagCounts[artwork.subject] || 0) + 1
    if (artwork.colour) tagCounts[artwork.colour] = (tagCounts[artwork.colour] || 0) + 1
    if (artwork.price) {
      const price = parseFloat(artwork.price.replace(/[^0-9.-]+/g, ""))
      if (!isNaN(price)) prices.push(price)
    }
  }

  const topFrom = (counts: Record<string, number>, n: number) =>
    Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, n)
      .map(([name]) => name)

  const topArtists = topFrom(artistCounts, 5)
  const topTags = topFrom(tagCounts, 8)
  const preferredMediums = topFrom(mediumCounts, 4)
  const priceRange =
    prices.length > 0
      ? `$${Math.min(...prices).toLocaleString()} – $${Math.max(...prices).toLocaleString()}`
      : "N/A"

  let summary = `Your collection spans ${topTags.slice(0, 3).join(", ") || "diverse styles"}, reflecting a distinctive visual point of view.`
  if (artworks.length === 1) {
    summary = `Your collection begins with a single piece by ${topArtists[0] || "an artist you admire"} — a strong first signal for your Kurator.`
  }

  return {
    summary,
    topArtists,
    topTags,
    priceRange,
    preferredMediums,
    recommendations: ["Keep swiping in Discover to sharpen your personalised feed."],
  }
}

export function getTopPreferenceSignals(
  prefs: Record<string, number> | undefined,
  limit = 6
): string[] {
  if (!prefs) return []
  return Object.entries(prefs)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([label]) => label)
}

export function resolveArchetype(artworks: Artwork[]) {
  return analyzeCollectionForArchetype(artworks)
}

export async function fetchAiTasteInsights(
  collection: Artwork[]
): Promise<AiTasteInsights | null> {
  if (collection.length === 0) return null

  const payload = collection.map((a) => ({
    artwork_title: a.title,
    artist: a.artist,
    description: a.description,
    genre: a.genre,
    style: a.style,
    subject: a.subject,
    colour: a.colour,
    medium: a.medium,
    price: a.price,
    tags: a.tags,
  }))

  const response = await fetch("/api/profile-insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collection: payload }),
  })

  if (!response.ok) return null

  const data = await response.json()
  return {
    summary: data.summary || "",
    aesthetic_profile: data.aesthetic_profile || "",
    collecting_pattern: data.collecting_pattern || "",
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
    explorationSuggestions: Array.isArray(data.explorationSuggestions)
      ? data.explorationSuggestions
      : [],
  }
}
