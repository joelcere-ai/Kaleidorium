"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ArtworkDetails } from "@/components/artwork-details"
import type { Artwork } from "@/types/artwork"

interface ArtworkDetailOverlayProps {
  artwork: Artwork | null
  open: boolean
  onClose: () => void
}

export function ArtworkDetailOverlay({ artwork, open, onClose }: ArtworkDetailOverlayProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open || !artwork) return null

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end md:items-center justify-center bg-black/50 p-0 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="featured-artwork-detail-title"
      onClick={onClose}
    >
      <div
        className="bg-white w-full md:max-w-3xl lg:max-w-5xl max-h-[92vh] md:max-h-[90vh] overflow-y-auto overscroll-contain rounded-t-2xl md:rounded-2xl shadow-xl"
        style={{ WebkitOverflowScrolling: "touch" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#E6E4DF]" aria-hidden />
        </div>

        <div className="flex justify-between items-start gap-3 px-4 md:px-6 pt-2 md:pt-5 pb-2 border-b border-[#E6E4DF]">
          <div className="min-w-0 flex-1">
            <h2
              id="featured-artwork-detail-title"
              className="text-lg md:text-xl font-bold text-[#1E1E1C] truncate"
            >
              {artwork.title}
            </h2>
            <p className="text-sm text-[#8A8A84] truncate">by {artwork.artist}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="flex-shrink-0 text-[#1E1E1C] hover:bg-[#FAFAF8]"
            aria-label="Close artwork details"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row">
          <div className="w-full lg:w-[55%] flex-shrink-0 bg-[#FAFAF8] border-b lg:border-b-0 lg:border-r border-[#E6E4DF]">
            <div className="relative aspect-square lg:aspect-auto lg:min-h-[360px] lg:h-full max-h-[50vh] lg:max-h-none">
              <img
                src={artwork.artwork_image || "/placeholder.svg"}
                alt={artwork.title}
                className="w-full h-full object-contain p-4"
              />
            </div>
          </div>
          <div className="w-full lg:w-[45%] flex-1 min-w-0">
            <ArtworkDetails artwork={artwork} showShareButton />
          </div>
        </div>
      </div>
    </div>
  )
}
