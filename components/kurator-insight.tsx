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

type MatchType = "style" | "genre" | "subject" | "color" | "artist" | "medium"

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

function extractFromTags(
  tags: string[] | undefined,
  field: "style" | "genre" | "subject" | "colour"
): string | undefined {
  if (!tags?.length) return undefined
  const tagString = tags.join(" ").toLowerCase()
  const keywords: Record<string, string[]> = {
    style: ["abstract", "realism", "impressionism", "expressionism", "surrealism", "pop art", "minimalism", "conceptual", "street art", "cubism", "figurative"],
    genre: ["digital", "painting", "photography", "sculpture", "print", "drawing", "mixed media", "nft"],
    subject: ["portrait", "landscape", "nature", "urban", "abstract", "figure", "still life"],
    colour: ["white", "black", "blue", "red", "green", "yellow", "orange", "purple", "pink", "grey", "brown", "gold", "ivory", "lime", "teal"],
  }
  for (const keyword of keywords[field]) {
    if (tagString.includes(keyword)) return keyword
  }
  return undefined
}

function resolveArtworkFields(artwork: Artwork) {
  return {
    style: artwork.style || extractFromTags(artwork.tags, "style"),
    genre: artwork.genre || extractFromTags(artwork.tags, "genre"),
    subject: artwork.subject || extractFromTags(artwork.tags, "subject"),
    colour: artwork.colour || extractFromTags(artwork.tags, "colour"),
    medium: artwork.medium?.trim() || undefined,
  }
}

function normalizeSegmentKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+style$/, "")
    .replace(/\s+subject$/, "")
    .replace(/\s+palette$/, "")
    .trim()
}

/** Artwork metadata segments, deduped (e.g. genre "Digital" + medium "Digital Art"). */
function buildArtworkSummary(artwork: Artwork): string | null {
  const { style, genre, subject, colour, medium } = resolveArtworkFields(artwork)
  const segments: string[] = []
  const seen = new Set<string>()

  const add = (label: string) => {
    const key = normalizeSegmentKey(label)
    if (!key) return
    for (const existing of seen) {
      if (existing.includes(key) || key.includes(existing)) return
    }
    seen.add(key)
    segments.push(label)
  }

  if (style) add(`${capitalize(style)} style`)
  if (genre && genre.toLowerCase() !== style?.toLowerCase()) add(capitalize(genre))
  if (subject) add(`${subject} subject`)
  if (colour) add(`${colour.toLowerCase()} palette`)
  if (medium) {
    const mediumLower = medium.toLowerCase()
    const alreadyCovered = [...seen].some(
      (key) => mediumLower.includes(key) || key.includes(mediumLower)
    )
    if (!alreadyCovered) add(medium)
  }

  if (segments.length === 0) return null
  return joinParts(segments)
}

function buildArtistSummary(artwork: Artwork): string | null {
  const summary = buildArtworkSummary(artwork)
  if (!summary) return null
  const artist = artwork.artist?.trim() || "This work"
  return `${artist} brings together ${summary}`
}

function dedupeMatchValues(matches: MatchedAttribute[]): MatchedAttribute[] {
  const seen = new Set<string>()
  return matches.filter((m) => {
    const key = `${m.type}:${m.value.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
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
  const fields = resolveArtworkFields(artwork)
  const matches: MatchedAttribute[] = []

  const styleScore = scoreOf(preferences.styles, fields.style)
  if (styleScore > 0 && fields.style)
    matches.push({ type: "style", value: fields.style, score: styleScore })

  const genreScore = scoreOf(preferences.genres, fields.genre)
  if (
    genreScore > 0 &&
    fields.genre &&
    fields.genre.toLowerCase() !== fields.style?.toLowerCase()
  )
    matches.push({ type: "genre", value: fields.genre, score: genreScore })

  const subjectScore = scoreOf(preferences.subjects, fields.subject)
  if (subjectScore > 0 && fields.subject)
    matches.push({ type: "subject", value: fields.subject, score: subjectScore })

  const colourMatch = bestColour(fields.colour, preferences.colors)
  if (colourMatch)
    matches.push({ type: "color", value: colourMatch.value, score: colourMatch.score })

  // Match medium against genre preferences (e.g. "Painting", "Mixed Media")
  if (fields.medium) {
    const mediumLower = fields.medium.toLowerCase()
    for (const [genreKey, score] of Object.entries(preferences.genres)) {
      if (score > 0 && mediumLower.includes(genreKey.toLowerCase())) {
        matches.push({ type: "medium", value: genreKey, score })
        break
      }
    }
  }

  // ── Tags fallback when structured fields are missing ───────────────────────
  if (matches.length < 3 && artwork.tags?.length) {
    const allPrefKeys = [
      ...Object.keys(preferences.styles),
      ...Object.keys(preferences.genres),
      ...Object.keys(preferences.subjects),
      ...Object.keys(preferences.colors),
    ].map((k) => k.toLowerCase())

    for (const tag of artwork.tags) {
      if (matches.length >= 5) break
      if (!allPrefKeys.includes(tag.toLowerCase())) continue
      const s =
        scoreOf(preferences.styles, tag) ||
        scoreOf(preferences.genres, tag) ||
        scoreOf(preferences.subjects, tag) ||
        scoreOf(preferences.colors, tag)
      if (s > 0) {
        const type: MatchType =
          scoreOf(preferences.styles, tag) > 0 ? "style"
          : scoreOf(preferences.genres, tag) > 0 ? "genre"
          : scoreOf(preferences.subjects, tag) > 0 ? "subject"
          : "color"
        matches.push({ type, value: tag, score: s })
      }
    }
  }

  const artistScore = scoreOf(preferences.artists, artwork.artist)
  const artistLiked = artistScore >= 2
  if (artistLiked)
    matches.push({ type: "artist", value: artwork.artist, score: artistScore })

  const artistSummary = buildArtistSummary(artwork)
  const dedupedMatches = dedupeMatchValues(matches)

  // ── Route to the right message bank ───────────────────────────────────────
  const hasMatches = dedupedMatches.length > 0

  if (!hasMatches) {
    if (isNew) {
      const msg = artSeed(artwork.id, NEW_DISCOVERY)
      return artistSummary ? { headline: msg.headline, reason: artistSummary } : msg
    }
    if (preferences.interactionCount >= 10) {
      const msg = artSeed(artwork.id, SERENDIPITY)
      return artistSummary ? { headline: msg.headline, reason: artistSummary } : msg
    }
    const msg = artSeed(artwork.id, GENERIC)
    return artistSummary ? { headline: msg.headline, reason: artistSummary } : msg
  }

  const totalScore = dedupedMatches.reduce((s, m) => s + m.score, 0)
  const ic = preferences.interactionCount
  let headline: string
  if (artistLiked && dedupedMatches.length === 1 && dedupedMatches[0].type === "artist") {
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

  const reason =
    artistSummary ??
    `${artwork.artist?.trim() || "This artist"} is a strong match for your taste profile`

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
          <p className="text-xs text-gray-800 leading-snug">
            <span className="font-semibold">
              {message.headline.endsWith(".") ? message.headline : `${message.headline}.`}
            </span>{" "}
            <span className="text-gray-500">{message.reason}</span>
          </p>
          <KuratorEncouragement interactionCount={localPreferences.interactionCount} />
        </div>
      </div>
    </div>
  )
}

/** Secondary nudge shown under each artwork while the taste profile is still developing. */
export function KuratorEncouragement({ interactionCount }: { interactionCount: number }) {
  if (interactionCount >= 40) return null

  return (
    <p className="text-xs text-gray-500 mt-1.5 leading-snug">
      Continue liking and swiping to get more personalised suggestions
    </p>
  )
}

/** Shown when personalised insight is not yet available (fewer than 3 interactions). */
export function KuratorEarlyEncouragement({ interactionCount }: { interactionCount: number }) {
  if (interactionCount >= 3 || interactionCount >= 40) return null

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
            Your Kurator is learning your taste
          </p>
          <KuratorEncouragement interactionCount={interactionCount} />
        </div>
      </div>
    </div>
  )
}

