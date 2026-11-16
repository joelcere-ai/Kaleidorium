"use client"

import { useMemo } from "react"

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

interface KuratorBannerProps {
  localPreferences: LocalPreferences
  isRegistered: boolean
  newArtworkCount?: number
}

// ─── Message logic ─────────────────────────────────────────────────────────────

interface BannerMessage {
  headline: string
  sub: string
  showRegister?: boolean
  /** First-visit Discover intro: multi-line hierarchy */
  intro?: {
    brand: string
    body: string
    cta: string
    goal: string
  }
}

function pickMessage(count: number, isRegistered: boolean): BannerMessage {
  // Encourage registration once user has enough taste data
  if (!isRegistered && count >= 8) {
    return {
      headline: "Register to save your preferences!",
      sub: "Your taste profile is ready — don't lose it",
      showRegister: true,
    }
  }

  if (count === 0) {
    return {
      headline: "How well do you know your taste in art?",
      sub: "Discover artworks you will love. The more you like, the more Kaleidorium learns about your taste.",
      intro: {
        brand: "Kaleidorium — Your personal art curator",
        body: "Discover artworks you will love. The more you like, the more Kaleidorium learns about your taste.",
        cta: "Start exploring. No sign-up required.",
        goal: "Like 10 artworks to start revealing your personal taste profile.",
      },
    }
  }

  if (count <= 3) {
    const left = 10 - count
    return {
      headline: "Your Kurator is learning your taste",
      sub: `${left} more swipes or likes for sharper recommendations`,
    }
  }

  if (count <= 6) {
    const left = 10 - count
    return {
      headline: "Your taste profile is taking shape",
      sub: `Keep going — ${left} more swipes or likes to unlock more personal picks`,
    }
  }

  if (count <= 9) {
    const left = 10 - count
    return {
      headline: "Your Kurator is warming up",
      sub: `${left} more swipes or likes to refine your recommendations`,
    }
  }

  if (count <= 15) {
    return {
      headline: "Your preferences are starting to emerge",
      sub: "Keep swiping or liking to make your feed more personal",
    }
  }

  if (count <= 25) {
    return {
      headline: "You're training your Kurator",
      sub: "A few more likes, dislikes, or swipes will sharpen the match",
    }
  }

  if (count <= 40) {
    return {
      headline: "We're getting to know your eye",
      sub: "Your feed is becoming increasingly personal",
    }
  }

  // Highly trained profile
  return {
    headline: "Your Kurator knows your eye",
    sub: "Your feed is now tailored closely to your taste",
  }
}

// ─── Gradient Orb ─────────────────────────────────────────────────────────────

function KuratorOrb({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-block rounded-full flex-shrink-0"
      style={{
        width: size,
        height: size,
        background:
          "conic-gradient(from 180deg, #EDE4FF, #C9B4F0, #9B7BD9, #6B4FD4, #5A3AA8, #8B6AD4, #D4C4F5, #EDE4FF)",
      }}
    />
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KuratorBanner({ localPreferences, isRegistered, newArtworkCount = 0 }: KuratorBannerProps) {
  const { interactionCount } = localPreferences

  const message = useMemo(
    () => pickMessage(interactionCount, isRegistered),
    [interactionCount, isRegistered]
  )

  // When there are new artworks since last visit, show that as the headline
  // and keep the learning message as the sub-line
  const headline = newArtworkCount > 0
    ? `We added ${newArtworkCount} artwork${newArtworkCount !== 1 ? "s" : ""} since your last visit`
    : message.headline

  const sub = newArtworkCount > 0 ? message.headline : message.sub
  const showIntro = Boolean(message.intro) && newArtworkCount === 0

  return (
    <div
      className="w-full rounded-2xl px-4 py-3 mb-4 discover-kurator-banner"
      style={{
        background:
          "linear-gradient(135deg, #f5f0ff 0%, #fdf2fb 40%, #fff7f0 100%)",
        border: "1px solid rgba(139,92,246,0.10)",
      }}
    >
      <div
        className={`flex gap-2.5 ${
          showIntro ? "items-start justify-center" : "items-center md:justify-center"
        }`}
      >
        <KuratorOrb size={18} />
        <div className={`min-w-0 ${showIntro ? "text-center" : "md:text-center"}`}>
          {showIntro && message.intro ? (
            <>
              <p className="text-[11px] font-medium text-gray-500 leading-snug tracking-wide">
                {message.intro.brand}
              </p>
              <p className="text-base md:text-lg font-semibold text-gray-900 leading-snug mt-1">
                {headline}
              </p>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                {message.intro.body}
              </p>
              <p className="text-xs font-medium text-gray-700 mt-1.5 leading-snug">
                {message.intro.cta}
              </p>
              <p className="text-xs text-gray-500 mt-1.5 leading-snug">
                {message.intro.goal}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-800 leading-snug">
                {headline}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                {sub}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Export the orb so both banner and insight can share the same style
export { KuratorOrb }

