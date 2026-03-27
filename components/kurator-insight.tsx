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
  lastVisitDate?: string | null
}

// ─── Types ────────────────────────────────────────────────────────────────────

type MatchType = "style" | "genre" | "subject" | "color" | "artist"

interface MatchedAttribute {
  type: MatchType
  value: string
  score: number
}

interface InsightMessage {
  headline: string
  reason: string
}

// ─── Message banks ────────────────────────────────────────────────────────────

const NEW_DISCOVERY: InsightMessage[] = [
  { headline: "Fresh discovery",               reason: "Newly surfaced for your profile" },
  { headline: "New for you today",             reason: "Your Kurator found this in your favourite styles" },
  { headline: "Recently matched to your taste", reason: "A new addition aligned to your preferences" },
  { headline: "Freshly curated",               reason: "A new match based on your recent swipes" },
  { headline: "New in your feed",              reason: "Chosen because it fits your visual profile" },
  { headline: "Just added to your recommendations", reason: "A likely fit based on your taste so far" },
]

const SERENDIPITY: InsightMessage[] = [
  { headline: "A little outside your usual taste", reason: "Chosen to broaden your visual profile" },
  { headline: "A surprising match",            reason: "Different palette, similar energy" },
  { headline: "A curated curveball",           reason: "Not typical for you, but likely to resonate" },
  { headline: "Something unexpected",          reason: "A new direction your Kurator thinks you may enjoy" },
  { headline: "A thoughtful detour",           reason: "Different style, familiar visual tension" },
  { headline: "An intentional surprise",       reason: "Chosen to expand your taste beyond the obvious" },
]

const GENERIC: InsightMessage[] = [
  { headline: "Your Kurator picked this",      reason: "A strong match for your recent taste profile" },
  { headline: "Tailored to your eye",          reason: "A likely match based on your recent swipes" },
  { headline: "A strong match for you",        reason: "Similar to artworks you've liked recently" },
  { headline: "Curated for you",               reason: "Based on the patterns in your recent swipes" },
  { headline: "Picked with care",              reason: "Close to the style and mood of work you've enjoyed" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function scoreOf(map: Record<string, number>, value: string | undefined): number {
  if (!value) return 0
  return (map[value] ?? map[value.toLowerCase()] ?? map[capitalize(value)] ?? 0)
}

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

function formatAttr(attr: MatchedAttribute): string {
  const v = attr.value.toLowerCase()
  switch (attr.type) {
    case "color":   return `${v} tones`
    case "subject": return v
    case "artist":  return attr.value
    default:        return v
  }
}

function joinParts(parts: string[]): string {
  if (parts.length === 0) return ""
  if (parts.length === 1) return parts[0]
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`
}

/** Stable seed from artwork id so messages never flicker on re-render. */
function artSeed(id: string, bank: InsightMessage[]): InsightMessage {
  const n = parseInt(
    (id ?? "0").toString().replace(/\D/g, "").slice(-4) || "0", 10
  )
  return bank[n % bank.length]
}

// ─── Core logic ───────────────────────────────────────────────────────────────

function buildInsightMessage(
  artwork: Artwork,
  preferences: LocalPreferences,
  lastVisitDate?: string | null
): InsightMessage | null {
  if (preferences.interactionCount < 3) return null

  // ── Detect if this artwork was added after the user's last visit ────────────
  const isNew =
    !!lastVisitDate &&
    !!artwork.created_at &&
    new Date(artwork.created_at) > new Date(lastVisitDate)

  // ── Collect preference matches ─────────────────────────────────────────────
  const matches: MatchedAttribute[] = []

  const styleScore = scoreOf(preferences.styles, artwork.style)
  if (styleScore > 0 && artwork.style)
    matches.push({ type: "style", value: artwork.style, score: styleScore })

  const genreScore = scoreOf(preferences.genres, artwork.genre)
  if (
    genreScore > 0 &&
    artwork.genre &&
    artwork.genre.toLowerCase() !== artwork.style?.toLowerCase()
  )
    matches.push({ type: "genre", value: artwork.genre, score: genreScore })

  const subjectScore = scoreOf(preferences.subjects, artwork.subject)
  if (subjectScore > 0 && artwork.subject)
    matches.push({ type: "subject", value: artwork.subject, score: subjectScore })

  const colourMatch = bestColour(artwork.colour, preferences.colors)
  if (colourMatch)
    matches.push({ type: "color", value: colourMatch.value, score: colourMatch.score })

  // ── Tags fallback when structured fields are missing ───────────────────────
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

  const artistScore = scoreOf(preferences.artists, artwork.artist)
  const artistLiked = artistScore >= 2

  // ── Route to the right message bank ───────────────────────────────────────
  const hasMatches = matches.length > 0 || artistLiked

  if (!hasMatches) {
    if (isNew) {
      // Newly added artwork with no obvious match → fresh-discovery framing
      return artSeed(artwork.id, NEW_DISCOVERY)
    }
    if (preferences.interactionCount >= 10) {
      // Experienced user, intentionally broadening taste → serendipity
      return artSeed(artwork.id, SERENDIPITY)
    }
    // New user or early interactions → generic encouraging message
    return artSeed(artwork.id, GENERIC)
  }

  // ── Build "Because you liked…" message for matched artworks ───────────────
  matches.sort((a, b) => b.score - a.score)
  const top = matches.slice(0, 3)

  let reason: string
  if (top.length === 0 && artistLiked) {
    reason = `You've engaged with ${artwork.artist}'s work before`
  } else {
    const parts = top.map(formatAttr)
    if (artistLiked && top.length < 3) parts.push(artwork.artist)
    reason = `Because you liked ${joinParts(parts)}`
  }

  const totalScore = matches.reduce((s, m) => s + m.score, 0)
  const ic = preferences.interactionCount
  let headline: string
  if (artistLiked && top.length === 0) {
    headline = "Your Kurator picked this"
  } else if (isNew) {
    headline = "New in your feed"
  } else if (totalScore >= 6 || ic >= 20) {
    headline = "Chosen for your taste"
  } else if (totalScore >= 3 || ic >= 10) {
    headline = "Picked with your taste in mind"
  } else {
    headline = "Your Kurator picked this"
  }

  return { headline, reason }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KuratorInsight({
  artwork,
  localPreferences,
  lastVisitDate,
}: KuratorInsightProps) {
  const message = useMemo(
    () => buildInsightMessage(artwork, localPreferences, lastVisitDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [artwork.id, localPreferences.interactionCount, lastVisitDate]
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
