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

export interface CollectionOverviewDetails {
  summary: string
  aestheticProfile: string
  collectingPattern: string
  highlights: string[]
}

export interface RecommendationInsights {
  intro: string
  recommendations: string[]
  explorationSuggestions: string[]
}

const EMPTY_PREFS: TastePreferences = {
  artists: {},
  genres: {},
  styles: {},
  subjects: {},
  colors: {},
  priceRanges: {},
  interactionCount: 0,
  viewed_artworks: [],
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

  const overview = buildCollectionOverview(artworks, 0)
  const recs = buildRecommendationInsights(artworks, {
    topArtists,
    topTags,
    preferredMediums,
    priceRange,
  }, EMPTY_PREFS, null)

  return {
    summary: overview.summary,
    topArtists,
    topTags,
    priceRange,
    preferredMediums,
    recommendations: recs.recommendations,
  }
}

function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.trim().toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function formatArtworkHighlight(artwork: Artwork): string {
  const meta = [artwork.medium, artwork.year].filter(Boolean).join(", ")
  return meta
    ? `${artwork.title} by ${artwork.artist} (${meta})`
    : `${artwork.title} by ${artwork.artist}`
}

export function buildCollectionOverview(
  artworks: Artwork[],
  interactionCount: number
): CollectionOverviewDetails {
  const highlights = artworks.map(formatArtworkHighlight)

  if (artworks.length === 0) {
    return {
      summary:
        "Your collection is still empty. Every artwork you save becomes a signal — helping your Kurator understand what moves you.",
      aestheticProfile:
        "As you like pieces in Discover, patterns will emerge: preferred colours, mediums, moods, and artists you return to.",
      collectingPattern:
        "Most collectors begin with a single strong yes. Save artworks that stop you mid-scroll — your profile grows from there.",
      highlights: [],
    }
  }

  const artists = [...new Set(artworks.map((a) => a.artist).filter(Boolean))]
  const styles = uniqueStrings(
    artworks.flatMap((a) => [a.style, a.genre, a.subject, ...(a.tags || [])].filter(Boolean) as string[])
  )
  const mediums = [...new Set(artworks.map((a) => a.medium).filter(Boolean))]
  const colours = [...new Set(artworks.map((a) => a.colour).filter(Boolean))]

  const stylePhrase =
    styles.length > 0
      ? styles.slice(0, 3).join(", ")
      : "a distinctive mix of visual ideas"

  let summary: string
  if (artworks.length === 1) {
    const piece = artworks[0]
    summary = `You've saved one artwork so far — ${piece.title} by ${piece.artist}. Even a single choice is meaningful: it tells your Kurator what kind of imagery, mood, and craft you respond to.`
  } else if (artworks.length <= 3) {
    summary = `Your collection holds ${artworks.length} saved works across ${artists.length} artist${artists.length !== 1 ? "s" : ""}, with recurring interests in ${stylePhrase}. At this stage, each new save sharpens your profile noticeably.`
  } else {
    summary = `Your collection spans ${artworks.length} artworks and ${artists.length} artists, with strong threads in ${stylePhrase}. Your Kurator reads these choices as a coherent point of view — not a random list.`
  }

  const aestheticParts: string[] = []
  if (colours.length > 0) {
    aestheticParts.push(`palette leanings toward ${colours.slice(0, 2).join(" and ")}`)
  }
  if (mediums.length > 0) {
    aestheticParts.push(`a pull toward ${mediums.slice(0, 2).join(" and ")}`)
  }
  if (styles.length > 0) {
    aestheticParts.push(`themes of ${styles.slice(0, 3).join(", ")}`)
  }

  const aestheticProfile =
    aestheticParts.length > 0
      ? `From what you've saved, you show ${aestheticParts.join("; ")}. These aren't labels — they're signals your Kurator uses to surface work that feels familiar, yet fresh.`
      : "Your saved works suggest you're drawn to pieces with a clear point of view — imagery that rewards a second look rather than quick scrolling."

  let collectingPattern: string
  if (artworks.length === 1) {
    collectingPattern =
      "You're building deliberately — starting with one piece that earned a definite yes. Many collectors begin this way before their taste widens or deepens."
  } else if (artists.length === 1) {
    collectingPattern = `You've focused on ${artists[0]} so far — a sign of strong artist affinity. Your Kurator can introduce related voices while honouring that loyalty.`
  } else if (artworks.length <= 3) {
    collectingPattern =
      "With a small but intentional collection, you're choosing quality over volume. Each save carries more weight in shaping your recommendations."
  } else {
    collectingPattern =
      "You're curating across multiple artists and moods — suggesting openness within a defined aesthetic territory rather than collecting at random."
  }

  if (interactionCount > 0) {
    collectingPattern += ` Your ${interactionCount} Discover interaction${interactionCount !== 1 ? "s" : ""} (likes, passes, views) further refine what your Kurator shows you.`
  }

  return {
    summary,
    aestheticProfile,
    collectingPattern,
    highlights,
  }
}

export function buildRecommendationInsights(
  artworks: Artwork[],
  basic: Pick<BasicCollectionInsights, "topArtists" | "topTags" | "preferredMediums" | "priceRange">,
  preferences: TastePreferences,
  ai: AiTasteInsights | null
): RecommendationInsights {
  const localRecommendations: string[] = []
  const localExploration: string[] = []

  if (basic.topArtists[0]) {
    localRecommendations.push(
      `Explore more works by ${basic.topArtists[0]} in Discover — your collection already points to a strong affinity.`
    )
  }

  if (basic.topArtists.length > 1) {
    localRecommendations.push(
      `Compare pieces by ${basic.topArtists.slice(0, 2).join(" and ")} to see how your taste holds across different subjects and palettes.`
    )
  }

  if (basic.topTags[0]) {
    localRecommendations.push(
      `Search, swipe, or like toward "${basic.topTags[0]}" in Discover — it's one of the clearest threads in your saved work.`
    )
    localExploration.push(`${basic.topTags[0]} variations`)
  }

  if (basic.preferredMediums[0]) {
    localRecommendations.push(
      `Look for more ${basic.preferredMediums[0]} pieces — medium is often where collectors find their comfort zone.`
    )
    localExploration.push(`Contemporary ${basic.preferredMediums[0].toLowerCase()}`)
  }

  const prefStyles = getTopPreferenceSignals(preferences.styles, 2)
  const prefGenres = getTopPreferenceSignals(preferences.genres, 2)
  for (const style of prefStyles) {
    localRecommendations.push(
      `You've engaged repeatedly with ${style} in Discover — try saving one piece in that vein to anchor your collection.`
    )
    localExploration.push(`Adjacent ${style}`)
  }
  for (const genre of prefGenres) {
    localExploration.push(genre)
  }

  if (artworks.length === 1 && artworks[0].style) {
    localExploration.push(`Works near ${artworks[0].style}`)
  }

  if (basic.priceRange !== "N/A") {
    localRecommendations.push(
      `Your saved works sit around ${basic.priceRange}. Filter Discover by price to find pieces that fit your collecting range.`
    )
  }

  localRecommendations.push(
    "Visit Featured and Taste Profile after each new save — your Kurator updates recommendations as your collection grows."
  )

  if (artworks.length < 3) {
    localRecommendations.push(
      "Save two or three more artworks you genuinely love — with a handful of pieces, your profile becomes dramatically more precise."
    )
  }

  const recommendations = uniqueStrings([
    ...(ai?.recommendations ?? []),
    ...localRecommendations,
  ]).slice(0, 6)

  const explorationSuggestions = uniqueStrings([
    ...(ai?.explorationSuggestions ?? []),
    ...localExploration,
    "Emerging voices",
    "Quiet interiors",
  ]).slice(0, 6)

  const intro =
    artworks.length === 0
      ? "Once you save artworks, your Kurator will suggest artists, styles, and themes to explore next."
      : artworks.length <= 2
        ? "Based on your early collection and Discover activity, here are focused ways to deepen your taste profile."
        : "Your Kurator combines your saved collection with swipe and like signals to suggest what to explore next."

  return {
    intro,
    recommendations:
      recommendations.length > 0
        ? recommendations
        : ["Explore Discover and like artworks that resonate — your recommendations will sharpen with each interaction."],
    explorationSuggestions,
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
