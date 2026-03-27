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

type MatchType = "style" | "genre" | "subject" | "color" | "artist"

interface MatchedAttribute {
  type: MatchType
  value: string
  score: number
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Look up a value (and its lowercase form) in a score map, return score. */
function scoreOf(map: Record<string, number>, value: string | undefined): number {
  if (!value) return 0
  return (map[value] ?? map[value.toLowerCase()] ?? map[value.toUpperCase()] ?? 0)
}

/** Find the best-matching colour from a comma-separated colour string. */
function bestColour(
  colourField: string | undefined,
  colorMap: Record<string, number>
): { value: string; score: number } | null {
  if (!colourField) return null
  const parts = colourField.split(",").map((c) => c.trim()).filter(Boolean)
  let best: { value: string; score: number } | null = null
  for (const part of parts) {
    const s = scoreOf(colorMap, part)
    if (s > 0 && (!best || s > best.score)) best = { value: part, score: s }
  }
  return best
}

/** Format a matched attribute into natural-sounding text. */
function formatAttr(attr: MatchedAttribute): string {
  const v = attr.value.toLowerCase()
  switch (attr.type) {
    case "color":   return `${v} tones`
    case "subject": return v
    case "artist":  return attr.value   // keep original casing for names
    default:        return v            // style / genre
  }
}

/** Join an array of strings with commas and "and" before the last item. */
function joinParts(parts: string[]): string {
  if (parts.length === 0) return ""
  if (parts.length === 1) return parts[0]
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`
}

// ─── Generic fallbacks (seeded by artwork id so they never flicker) ───────────

interface InsightMessage { headline: string; reason: string }

const GENERIC: InsightMessage[] = [
  { headline: "Your Kurator picked this",    reason: "A strong match for your recent taste profile" },
  { headline: "Tailored to your eye",        reason: "A likely match based on your recent swipes" },
  { headline: "A strong match for you",      reason: "Similar to artworks you've liked recently" },
  { headline: "Curated for you",             reason: "Based on the patterns in your recent swipes" },
  { headline: "Picked with care",            reason: "Close to the style and mood of work you've enjoyed" },
]

// ─── Core logic ───────────────────────────────────────────────────────────────

function buildInsightMessage(
  artwork: Artwork,
  preferences: LocalPreferences
): InsightMessage | null {
  if (preferences.interactionCount < 3) return null

  const matches: MatchedAttribute[] = []

  // ── Style ──────────────────────────────────────────────────────────────────
  const styleScore = scoreOf(preferences.styles, artwork.style)
  if (styleScore > 0 && artwork.style)
    matches.push({ type: "style", value: artwork.style, score: styleScore })

  // ── Genre (only if different from style) ───────────────────────────────────
  const genreScore = scoreOf(preferences.genres, artwork.genre)
  if (genreScore > 0 && artwork.genre && artwork.genre.toLowerCase() !== artwork.style?.toLowerCase())
    matches.push({ type: "genre", value: artwork.genre, score: genreScore })

  // ── Subject ────────────────────────────────────────────────────────────────
  const subjectScore = scoreOf(preferences.subjects, artwork.subject)
  if (subjectScore > 0 && artwork.subject)
    matches.push({ type: "subject", value: artwork.subject, score: subjectScore })

  // ── Colour ─────────────────────────────────────────────────────────────────
  const colourMatch = bestColour(artwork.colour, preferences.colors)
  if (colourMatch)
    matches.push({ type: "color", value: colourMatch.value, score: colourMatch.score })

  // ── Tags fallback (when structured fields are missing) ─────────────────────
  if (matches.length === 0 && artwork.tags?.length) {
    const allPrefKeys = [
      ...Object.keys(preferences.styles),
      ...Object.keys(preferences.genres),
      ...Object.keys(preferences.subjects),
    ].map((k) => k.toLowerCase())

    for (const tag of artwork.tags) {
      if (allPrefKeys.includes(tag.toLowerCase())) {
        const s =
          scoreOf(preferences.styles, tag) ||
          scoreOf(preferences.genres, tag) ||
          scoreOf(preferences.subjects, tag)
        if (s > 0) matches.push({ type: "style", value: tag, score: s })
        if (matches.length >= 2) break
      }
    }
  }

  // ── Artist match (adds to message if they've interacted with this artist) ──
  const artistScore = scoreOf(preferences.artists, artwork.artist)
  const artistLiked = artistScore >= 2  // at least 2 positive interactions

  // ── No match at all → generic ──────────────────────────────────────────────
  if (matches.length === 0 && !artistLiked) {
    const seed = parseInt(
      (artwork.id ?? "0").toString().replace(/\D/g, "").slice(-3) || "0", 10
    )
    return GENERIC[seed % GENERIC.length]
  }

  // ── Sort by score, take top 3 attributes ───────────────────────────────────
  matches.sort((a, b) => b.score - a.score)
  const top = matches.slice(0, 3)

  // ── Build the "reason" sentence ────────────────────────────────────────────
  let reason: string

  if (top.length === 0 && artistLiked) {
    // Artist match only
    reason = `You've engaged with ${artwork.artist}'s work before`
  } else {
    const parts = top.map(formatAttr)
    // Append artist if liked AND not already using all 3 slots
    if (artistLiked && top.length < 3) parts.push(artwork.artist)
    reason = `Because you liked ${joinParts(parts)}`
  }

  // ── Pick headline based on match quality ───────────────────────────────────
  const totalScore = matches.reduce((s, m) => s + m.score, 0)
  const interactionCount = preferences.interactionCount
  let headline: string

  if (artistLiked && top.length === 0) {
    headline = "Your Kurator picked this"
  } else if (totalScore >= 6 || interactionCount >= 20) {
    headline = "Chosen for your taste"
  } else if (totalScore >= 3 || interactionCount >= 10) {
    headline = "Picked with your taste in mind"
  } else {
    headline = "Your Kurator picked this"
  }

  return { headline, reason }
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
        background: "linear-gradient(135deg, #f5f0ff 0%, #fdf2fb 40%, #fff7f0 100%)",
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
