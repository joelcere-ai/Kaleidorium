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
}

// ─── Message logic ─────────────────────────────────────────────────────────────

interface BannerMessage {
  headline: string
  sub: string
  showRegister?: boolean
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
      headline: "Your Kurator is ready",
      sub: "Start swiping to discover art matched to your taste",
    }
  }

  if (count <= 3) {
    const left = 10 - count
    return {
      headline: "Your Kurator is learning your taste",
      sub: `${left} more swipes for sharper recommendations`,
    }
  }

  if (count <= 6) {
    const left = 10 - count
    return {
      headline: "Your taste profile is taking shape",
      sub: `Keep swiping — ${left} more swipes to unlock more personal picks`,
    }
  }

  if (count <= 9) {
    const left = 10 - count
    return {
      headline: "Your Kurator is warming up",
      sub: `${left} more swipes to refine your recommendations`,
    }
  }

  if (count <= 15) {
    return {
      headline: "Your preferences are starting to emerge",
      sub: "Keep swiping to make your feed more personal",
    }
  }

  if (count <= 25) {
    return {
      headline: "You're training your Kurator",
      sub: "A few more likes and skips will sharpen the match",
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
          "conic-gradient(from 180deg, #f97316, #eab308, #22c55e, #06b6d4, #8b5cf6, #ec4899, #f97316)",
      }}
    />
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KuratorBanner({ localPreferences, isRegistered }: KuratorBannerProps) {
  const { interactionCount } = localPreferences

  const message = useMemo(
    () => pickMessage(interactionCount, isRegistered),
    [interactionCount, isRegistered]
  )

  return (
    <div
      className="w-full rounded-2xl px-4 py-3 mb-4"
      style={{
        background:
          "linear-gradient(135deg, #f5f0ff 0%, #fdf2fb 40%, #fff7f0 100%)",
        border: "1px solid rgba(139,92,246,0.10)",
      }}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5">
          <KuratorOrb size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 leading-snug">
            {message.headline}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">
            {message.sub}
          </p>
        </div>
      </div>
    </div>
  )
}

// Export the orb so both banner and insight can share the same style
export { KuratorOrb }
