import type { Artwork } from "@/types/artwork"
import { getTopPreferenceSignals, type TastePreferences } from "@/lib/taste-profile"

export const GUEST_TASTE_INSIGHT_KEY = "kaleidorium_guest_taste_insight_shown"
export const GUEST_TASTE_INSIGHT_THRESHOLD = 10

export interface GuestTasteInsight {
  headline: string
  insight: string
  artists: string[]
  nudge: string
}

const STYLE_ARTIST_MAP: Array<{ match: RegExp; artists: string[] }> = [
  {
    match: /abstract|expression|gestural|colour.?field/i,
    artists: ["Hilma af Klint", "Gerhard Richter", "Julie Mehretu", "Helen Frankenthaler"],
  },
  {
    match: /impression|plein.?air|light.?filled/i,
    artists: ["Claude Monet", "Berthe Morisot", "Mary Cassatt", "John Singer Sargent"],
  },
  {
    match: /surreal|dream|fantast/i,
    artists: ["René Magritte", "Leonora Carrington", "Max Ernst", "Dorothea Tanning"],
  },
  {
    match: /minimal|geometric|hard.?edge|construct/i,
    artists: ["Agnes Martin", "Ellsworth Kelly", "Carmen Herrera", "Donald Judd"],
  },
  {
    match: /figurative|portrait|figur/i,
    artists: ["Lucian Freud", "Alice Neel", "Kerry James Marshall", "Marlene Dumas"],
  },
  {
    match: /landscape|nature|botanic|floral/i,
    artists: ["Georgia O'Keeffe", "David Hockney", "Peter Doig", "Emily Carr"],
  },
  {
    match: /photo|documentary|street/i,
    artists: ["Henri Cartier-Bresson", "Diane Arbus", "Cindy Sherman", "Wolfgang Tillmans"],
  },
  {
    match: /pop|graphic|comic/i,
    artists: ["Andy Warhol", "Roy Lichtenstein", "Yayoi Kusama", "Keith Haring"],
  },
  {
    match: /sculpt|installation|object/i,
    artists: ["Louise Bourgeois", "Anish Kapoor", "Barbara Hepworth", "Isamu Noguchi"],
  },
  {
    match: /digital|generative|new media|ai/i,
    artists: ["Refik Anadol", "Casey Reas", "Sougwen Chung", "Memo Akten"],
  },
]

const DEFAULT_ARTISTS = [
  "Georgia O'Keeffe",
  "David Hockney",
  "Yayoi Kusama",
  "Hilma af Klint",
  "Kerry James Marshall",
]

export const GUEST_TASTE_NUDGE =
  "Continue liking (or not) and we'll have more insights about your collector profile under Taste Profile."

function uniqueStrings(values: string[], limit = 5): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(trimmed)
    if (out.length >= limit) break
  }
  return out
}

function artistsForSignals(signals: string[]): string[] {
  const fromMap: string[] = []
  for (const signal of signals) {
    for (const entry of STYLE_ARTIST_MAP) {
      if (entry.match.test(signal)) {
        fromMap.push(...entry.artists)
      }
    }
  }
  return uniqueStrings([...fromMap, ...DEFAULT_ARTISTS], 5)
}

export function buildLocalGuestTasteInsight(
  preferences: TastePreferences,
  likedArtworks: Artwork[] = []
): GuestTasteInsight {
  const styles = getTopPreferenceSignals(preferences.styles, 3)
  const subjects = getTopPreferenceSignals(preferences.subjects, 3)
  const genres = getTopPreferenceSignals(preferences.genres, 2)
  const colors = getTopPreferenceSignals(preferences.colors, 2)
  const likedArtists = getTopPreferenceSignals(preferences.artists, 3)

  const signals = uniqueStrings([...styles, ...subjects, ...genres, ...colors], 4)
  const signalPhrase =
    signals.length > 0
      ? signals.slice(0, 3).join(", ").replace(/, ([^,]*)$/, " and $1")
      : "atmosphere, colour, and subject"

  const likedCount = likedArtworks.length
  const insight =
    likedCount > 0
      ? `From your first ${GUEST_TASTE_INSIGHT_THRESHOLD} likes and dislikes, a clear eye is emerging — you're drawn to ${signalPhrase}. That mix already sketches a collector taste that feels intentional rather than random.`
      : `From your first ${GUEST_TASTE_INSIGHT_THRESHOLD} reactions, your eye is leaning toward ${signalPhrase}. Even without saved works yet, those choices already outline a distinctive collector taste.`

  const artists = uniqueStrings(
    [...likedArtists, ...artistsForSignals(signals), ...likedArtworks.map((a) => a.artist || "")],
    5
  )

  return {
    headline: "Your collector taste is taking shape",
    insight,
    artists,
    nudge: GUEST_TASTE_NUDGE,
  }
}

export function shouldShowGuestTasteInsight(
  isRegistered: boolean,
  previousCount: number,
  nextCount: number
): boolean {
  if (isRegistered) return false
  if (nextCount < GUEST_TASTE_INSIGHT_THRESHOLD) return false
  if (previousCount >= GUEST_TASTE_INSIGHT_THRESHOLD) return false
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(GUEST_TASTE_INSIGHT_KEY) !== "true"
  } catch {
    return true
  }
}

export function markGuestTasteInsightShown(): void {
  try {
    localStorage.setItem(GUEST_TASTE_INSIGHT_KEY, "true")
  } catch {
    // ignore
  }
}

export async function fetchGuestTasteInsight(
  preferences: TastePreferences,
  likedArtworks: Artwork[]
): Promise<GuestTasteInsight | null> {
  try {
    const response = await fetch("/api/guest-taste-insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preferences: {
          artists: preferences.artists,
          genres: preferences.genres,
          styles: preferences.styles,
          subjects: preferences.subjects,
          colors: preferences.colors,
          interactionCount: preferences.interactionCount,
        },
        likedArtworks: likedArtworks.slice(0, 12).map((a) => ({
          title: a.title,
          artist: a.artist,
          style: a.style,
          genre: a.genre,
          subject: a.subject,
          colour: a.colour,
          medium: a.medium,
          tags: a.tags,
        })),
      }),
    })
    if (!response.ok) return null
    const data = await response.json()
    if (!data?.insight || !Array.isArray(data.artists)) return null
    return {
      headline: data.headline || "Your collector taste is taking shape",
      insight: String(data.insight),
      artists: data.artists.map(String).filter(Boolean).slice(0, 5),
      nudge: data.nudge || GUEST_TASTE_NUDGE,
    }
  } catch {
    return null
  }
}
