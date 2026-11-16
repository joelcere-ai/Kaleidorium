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
  onLike: (artwork: Artwork) => void
  onDislike: (artwork: Artwork) => void
  inCollection?: boolean
}

export function ArtworkDetailOverlay({
  artwork,
  open,
  onClose,
  onLike,
  onDislike,
}: ArtworkDetailOverlayProps) {
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
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/50 p-0 md:p-6"
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
            <div className="flex items-center justify-center gap-3 sm:gap-6 px-4 py-4 border-t border-[#E6E4DF]">
              <button
                type="button"
                onClick={() => onDislike(artwork)}
                className="flex-1 sm:flex-none h-[42px] px-5 inline-flex items-center justify-center gap-2 bg-white border border-black rounded-[11px] text-[#000000] font-bold text-[15px] cursor-pointer active:scale-95 hover:bg-[#8B6AD4] hover:border-[#8B6AD4] hover:text-white transition-all duration-150"
                aria-label="Dislike"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/></svg>
                Dislike
              </button>
              <button
                type="button"
                onClick={() => onLike(artwork)}
                className="flex-1 sm:flex-none h-[42px] px-5 inline-flex items-center justify-center gap-2 bg-white border border-black rounded-[11px] text-[#000000] font-bold text-[15px] cursor-pointer active:scale-95 hover:bg-[#8B6AD4] hover:border-[#8B6AD4] hover:text-white transition-all duration-150"
                aria-label="Like and add to collection"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4.67A2.31 2.31 0 012 20V13a2.31 2.31 0 012.33-2H7"/></svg>
                Like
              </button>
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
