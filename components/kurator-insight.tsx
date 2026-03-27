"use client"

import { useMemo } from "react"
import { KuratorOrb } from "./kurator-banner"
import type { Artwork } from "@/types/artwork"

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocalPreferences {
  artists: Record<string, number>
  genres: Record<string, number>
  styles: Record<string, number>
  subjects: Record<string, number>
  colors: Record<string, number>
  priceRanges: Record<string, number>
  interactionCount: number
  viewed_artworks: string[]
}

interface KuratorInsightProps {
  artwork: Artwork
  localPreferences: LocalPreferences
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Return the top N keys from a score map, sorted by score descending. */
function topKeys(map: Record<string, number>, n = 3): string[] {
  return Object.entries(map)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key]) => key.toLowerCase())
}

/** Capitalise first letter of every word. */
function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Message logic ─────────────────────────────────────────────────────────────

interface InsightMessage {
  headline: string
  reason: string
}

const GENERIC_MESSAGES: InsightMessage[] = [
  {
    headline: "Your Kurator picked this",
    reason: "A strong match for your recent interest in abstract works",
  },
  {
    headline: "Tailored to your eye",
    reason: "A likely match based on your recent swipes",
  },
  {
    headline: "A strong match for your profile",
    reason: "Similar to artworks you've liked recently",
  },
  {
    headline: "This fits your current taste profile",
    reason: "Similar energy, palette and composition to works you liked",
  },
  {
    headline: "Curated for you",
    reason: "Based on the patterns in your recent swipes",
  },
]

function buildInsightMessage(
  artwork: Artwork,
  preferences: LocalPreferences
): InsightMessage | null {
  const { interactionCount } = preferences

  // Need at least 3 interactions to show a meaningful message
  if (interactionCount < 3) return null

  const topStyles = topKeys(preferences.styles, 3)
  const topGenres = topKeys(preferences.genres, 3)
  const topSubjects = topKeys(preferences.subjects, 3)
  const topColors = topKeys(preferences.colors, 3)

  const matches: string[] = []

  // Check artwork attributes against top user preferences
  const artStyle = artwork.style?.toLowerCase()
  const artGenre = artwork.genre?.toLowerCase()
  const artSubject = artwork.subject?.toLowerCase()
  const artColour = artwork.colour?.toLowerCase()

  if (artStyle && topStyles.includes(artStyle)) matches.push(artStyle)
  if (artGenre && topGenres.includes(artGenre) && artGenre !== artStyle) matches.push(artGenre)
  if (artSubject && topSubjects.includes(artSubject)) matches.push(artSubject)
  if (artColour) {
    const colours = artColour.split(",").map((c) => c.trim())
    const matchedColour = colours.find((c) => topColors.includes(c))
    if (matchedColour) matches.push(matchedColour + " palette")
  }

  // Also check tags array as fallback
  if (matches.length === 0 && artwork.tags) {
    const artTags = artwork.tags.map((t) => t.toLowerCase())
    const allTopPrefs = [...topStyles, ...topGenres, ...topSubjects]
    const tagMatch = artTags.find((t) => allTopPrefs.includes(t))
    if (tagMatch) matches.push(tagMatch)
  }

  if (matches.length > 0) {
    const formatted = matches.slice(0, 3).map(titleCase).join(", ")
    // Pick headline based on how many swipes the user has done
    const headline =
      interactionCount >= 20
        ? "Chosen for your taste"
        : interactionCount >= 10
        ? "Picked with your taste in mind"
        : "Your Kurator picked this"

    return {
      headline,
      reason: `Because you liked ${formatted.toLowerCase()}`,
    }
  }

  // No specific match — use a deterministic generic message so it doesn't
  // flicker between renders (use artwork id as seed)
  const seed = artwork.id
    ? parseInt(artwork.id.toString().replace(/\D/g, "").slice(-3) || "0", 10)
    : 0
  return GENERIC_MESSAGES[seed % GENERIC_MESSAGES.length]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KuratorInsight({ artwork, localPreferences }: KuratorInsightProps) {
  const message = useMemo(
    () => buildInsightMessage(artwork, localPreferences),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [artwork.id, localPreferences.interactionCount]
  )

  if (!message) return null

  return (
    <div
      className="w-full rounded-xl px-3 py-2.5 mt-2"
      style={{
        background:
          "linear-gradient(135deg, #f5f0ff 0%, #fdf2fb 40%, #fff7f0 100%)",
        border: "1px solid rgba(139,92,246,0.10)",
      }}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5">
          <KuratorOrb size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-800 leading-snug">
            {message.headline}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">
            {message.reason}
          </p>
        </div>
      </div>
    </div>
  )
}
