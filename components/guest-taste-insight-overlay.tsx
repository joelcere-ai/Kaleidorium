"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { KuratorOrb } from "@/components/kurator-banner"
import type { GuestTasteInsight } from "@/lib/guest-taste-insight"

interface GuestTasteInsightOverlayProps {
  show: boolean
  insight: GuestTasteInsight | null
  loading?: boolean
  onDismiss: () => void
  onViewTasteProfile: () => void
}

export function GuestTasteInsightOverlay({
  show,
  insight,
  loading = false,
  onDismiss,
  onViewTasteProfile,
}: GuestTasteInsightOverlayProps) {
  if (!show || !insight) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-taste-insight-title"
      >
        <div
          className="px-5 pt-5 pb-4"
          style={{
            background:
              "linear-gradient(135deg, #f5f0ff 0%, #fdf2fb 45%, #fff7f0 100%)",
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </Button>

          <div className="flex flex-col items-center text-center gap-2 pr-6">
            <KuratorOrb size={28} />
            <p className="text-[11px] font-medium text-gray-500 tracking-wide">
              Kaleidorium Kurator
            </p>
            <h2
              id="guest-taste-insight-title"
              className="text-lg font-semibold text-gray-900 leading-snug"
            >
              {insight.headline}
            </h2>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4 text-center">
          <p className="text-sm text-gray-700 leading-relaxed">{insight.insight}</p>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Artists to explore
            </p>
            {loading && insight.artists.length === 0 ? (
              <p className="text-xs text-gray-400">Finding artists matched to your eye…</p>
            ) : (
              <ul className="flex flex-wrap justify-center gap-2">
                {insight.artists.map((artist) => (
                  <li
                    key={artist}
                    className="text-xs px-2.5 py-1 rounded-full bg-[#F0EBFF] text-[#6B4FD4]"
                  >
                    {artist}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-gray-400 mt-2">
              Including artists beyond Kaleidorium — worth seeking out.
            </p>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">{insight.nudge}</p>

          <div className="flex flex-col gap-2 pt-1">
            <Button
              onClick={onViewTasteProfile}
              className="w-full bg-white border border-black text-black font-bold hover:bg-[#8B6AD4] hover:border-[#8B6AD4] hover:text-white"
              style={{ fontSize: "14px", fontFamily: "Arial, sans-serif" }}
            >
              View Taste Profile
            </Button>
            <Button
              variant="ghost"
              onClick={onDismiss}
              className="w-full text-gray-600 hover:text-[#6B4FD4] hover:bg-[#F0EBFF]"
              style={{ fontSize: "14px", fontFamily: "Arial, sans-serif" }}
            >
              Keep exploring
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
