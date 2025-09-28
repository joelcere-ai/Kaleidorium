"use client"

import { useState, useRef, useEffect } from "react"
import { Heart, ThumbsUp, ThumbsDown, Plus, Menu, Info, Search, Palette, Mail, User, ArrowLeft, Trash, X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import type { Artwork } from "@/types/artwork"
import MobileCardStack from "./mobile-card-stack"

interface MobileArtDiscoveryProps {
  artworks: Artwork[]
  currentIndex: number
  onNext: () => void
  onLike: (artwork: Artwork) => void
  onDislike: (artwork: Artwork) => void
  onAddToCollection: (artwork: Artwork) => void
  onLoadMore: () => void
  setView: (view: "discover" | "collection" | "profile" | "for-artists") => void
  view: "discover" | "collection"
  collection: Artwork[]
  onRemoveFromCollection: (id: string) => void
  onFilterChange?: (filters: { style: string[], subject: string[], colors: string[] }) => void
  onClearFilters?: () => void
  showFallbackMessage?: boolean
  isLandscape?: boolean
  isPortrait?: boolean
  screenWidth?: number
  screenHeight?: number
}

export default function MobileArtDiscovery({
  artworks,
  currentIndex,
  onNext,
  onLike,
  onDislike,
  onAddToCollection,
  onLoadMore,
  setView,
  view = "discover",
  collection = [],
  onRemoveFromCollection,
  onFilterChange,
  onClearFilters,
  showFallbackMessage = false,
  isLandscape = false,
  isPortrait = true,
  screenWidth = 0,
  screenHeight = 0,
}: MobileArtDiscoveryProps) {
  return (
    <MobileCardStack
      artworks={artworks}
      onLike={onLike}
      onDislike={onDislike}
      onAddToCollection={onAddToCollection}
      onLoadMore={onLoadMore}
      setView={setView}
      view={view}
      collection={collection}
      onRemoveFromCollection={onRemoveFromCollection}
      onFilterChange={onFilterChange}
      onClearFilters={onClearFilters}
      showFallbackMessage={showFallbackMessage}
      isLandscape={isLandscape}
      isPortrait={isPortrait}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
    />
  )
} 