"use client"

import { useState, useRef, useEffect } from "react"
import { Heart, ThumbsUp, ThumbsDown, Plus, Menu, Info, Search, Palette, Mail, User, ArrowLeft, Trash, X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import type { Artwork } from "@/types/artwork"
import MobileCardStack from "./mobile-card-stack"
import { KuratorBanner } from "./kurator-banner"

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

interface MobileArtDiscoveryProps {
  artworks: Artwork[]
  currentIndex: number
  onNext: () => void
  onLike: (artwork: Artwork) => void
  onDislike: (artwork: Artwork) => void
  onAddToCollection: (artwork: Artwork) => void
  onLoadMore: () => void
  setView: (view: "discover" | "collection" | "profile" | "why-kaleidorium" | "for-artists" | "for-galleries" | "about" | "contact" | "pricing" | "terms" | "privacy") => void
  view: "discover" | "collection"
  collection: Artwork[]
  onRemoveFromCollection: (id: string) => void
  onFilterChange?: (filters: { style: string[], subject: string[], colors: string[] }) => void
  onClearFilters?: () => void
  showFallbackMessage?: boolean
  fallbackMessage?: string
  isLandscape?: boolean
  isPortrait?: boolean
  screenWidth?: number
  screenHeight?: number
  localPreferences?: LocalPreferences
  isRegistered?: boolean
  newArtworkCount?: number
  lastVisitDate?: string | null
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
  fallbackMessage,
  isLandscape = false,
  isPortrait = true,
  screenWidth = 0,
  screenHeight = 0,
  localPreferences,
  isRegistered = false,
  newArtworkCount = 0,
  lastVisitDate,
}: MobileArtDiscoveryProps) {
  const defaultPreferences: LocalPreferences = {
    artists: {}, genres: {}, styles: {}, subjects: {}, colors: {}, priceRanges: {}, interactionCount: 0, viewed_artworks: [],
  }
  const prefs = localPreferences ?? defaultPreferences

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
      fallbackMessage={fallbackMessage}
      isLandscape={isLandscape}
      isPortrait={isPortrait}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
      localPreferences={prefs}
      isRegistered={isRegistered}
      newArtworkCount={newArtworkCount}
      lastVisitDate={lastVisitDate}
    />
  )
} 