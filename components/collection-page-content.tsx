"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Bookmark,
  Heart,
  Info,
  LayoutGrid,
  List,
  MoreVertical,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DiscoverSearchBar } from "@/components/discover-search-bar"
import { useArtworkSearch } from "@/contexts/artwork-search-context"
import { ArtistNameWithBadge } from "@/components/artist-name-with-badge"
import type { Artwork } from "@/types/artwork"

type SortOption = "recent" | "title" | "artist"
type ViewMode = "grid" | "list"

interface CollectionPageContentProps {
  artworks: Artwork[]
  isMobile?: boolean
  onRemoveFromCollection: (id: string) => void
  onViewInDiscover: (artwork: Artwork) => void
  onDiscover: () => void
}

function formatArtworkMeta(artwork: Artwork) {
  const parts = [artwork.year, artwork.medium].filter(Boolean)
  return parts.join(" · ")
}

export function CollectionPageContent({
  artworks,
  isMobile = false,
  onRemoveFromCollection,
  onViewInDiscover,
  onDiscover,
}: CollectionPageContentProps) {
  const {
    input,
    setInput,
    submitSearch,
    clearSearch,
    query,
    loading,
    error,
  } = useArtworkSearch()

  const [sortBy, setSortBy] = useState<SortOption>("recent")
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? "list" : "grid")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setViewMode(isMobile ? "list" : "grid")
  }, [isMobile])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const sortedArtworks = useMemo(() => {
    const items = [...artworks]
    if (sortBy === "title") {
      return items.sort((a, b) => a.title.localeCompare(b.title))
    }
    if (sortBy === "artist") {
      return items.sort((a, b) => a.artist.localeCompare(b.artist))
    }
    return items.reverse()
  }, [artworks, sortBy])

  if (artworks.length === 0) {
    return (
      <div className="collection-page">
        <div className="collection-page-search">
          <DiscoverSearchBar
            embedded
            value={input}
            onChange={setInput}
            onSubmit={submitSearch}
            onClear={clearSearch}
            activeQuery={query || null}
            isLoading={loading}
            error={error}
          />
        </div>
        <div className="collection-empty-state">
          <div className="collection-empty-icon">
            <Heart className="h-9 w-9 text-[#1E1E1C]" strokeWidth={1.5} />
          </div>
          <h3 className="collection-empty-title">Your collection is empty</h3>
          <p className="collection-empty-copy">
            Like an artwork to add it to your collection. Click the Like button on any piece you love
            while discovering, and it will appear here.
          </p>
          <Button variant="outline" onClick={onDiscover}>
            Discover Artwork
          </Button>
        </div>
      </div>
    )
  }

  const renderMenu = (artwork: Artwork) => (
    <div className="collection-card-menu-wrap" ref={openMenuId === artwork.id ? menuRef : null}>
      <button
        type="button"
        className="collection-card-menu-btn"
        aria-label="Artwork actions"
        onClick={(event) => {
          event.stopPropagation()
          setOpenMenuId((current) => (current === artwork.id ? null : artwork.id))
        }}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {openMenuId === artwork.id && (
        <div className="collection-card-menu" role="menu">
          <button
            type="button"
            className="collection-card-menu-item collection-card-menu-item--danger"
            onClick={(event) => {
              event.stopPropagation()
              setOpenMenuId(null)
              onRemoveFromCollection(artwork.id)
            }}
          >
            <Trash2 className="w-4 h-4" />
            Remove from collection
          </button>
          <button
            type="button"
            className="collection-card-menu-item"
            onClick={(event) => {
              event.stopPropagation()
              setOpenMenuId(null)
              onViewInDiscover(artwork)
            }}
          >
            <Info className="w-4 h-4" />
            View details
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="collection-page">
      <div className="collection-page-search">
        <DiscoverSearchBar
          embedded
          value={input}
          onChange={setInput}
          onSubmit={submitSearch}
          onClear={clearSearch}
          activeQuery={query || null}
          isLoading={loading}
          error={error}
        />
      </div>

      <div className="collection-page-inner">
        <section className="collection-banner">
          <div className="collection-banner-copy">
            <h1 className="collection-banner-title">Your Collection</h1>
            <p className="collection-banner-subtitle">
              Art you&apos;ve liked — building your personal collection.
            </p>
          </div>
          <div className="collection-banner-stat">
            <Bookmark className="w-5 h-5 text-[#6B57B8]" strokeWidth={1.75} />
            <div>
              <p className="collection-banner-stat-count">{artworks.length} Artworks</p>
              <p className="collection-banner-stat-label">Keep discovering</p>
            </div>
          </div>
        </section>

        <section className="collection-toolbar">
          <button type="button" className="collection-filter-pill collection-filter-pill--active">
            All ({artworks.length})
          </button>

          <div className="collection-toolbar-right">
            <label className="collection-sort">
              <span>Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="collection-sort-select"
              >
                <option value="recent">Most recent</option>
                <option value="title">Title</option>
                <option value="artist">Artist</option>
              </select>
            </label>

            {!isMobile && (
              <div className="collection-view-toggle">
                <button
                  type="button"
                  className={`collection-view-toggle-btn${
                    viewMode === "grid" ? " collection-view-toggle-btn--active" : ""
                  }`}
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className={`collection-view-toggle-btn${
                    viewMode === "list" ? " collection-view-toggle-btn--active" : ""
                  }`}
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </section>

        {viewMode === "grid" && !isMobile ? (
          <div className="collection-grid">
            {sortedArtworks.map((artwork) => (
              <article
                key={artwork.id}
                className="collection-card"
                onClick={() => onViewInDiscover(artwork)}
              >
                <div className="collection-card-image-wrap">
                  <img
                    src={artwork.artwork_image || "/placeholder.svg"}
                    alt={artwork.title}
                    className="collection-card-image"
                  />
                  {renderMenu(artwork)}
                </div>
                <div className="collection-card-body">
                  <h2 className="collection-card-title">{artwork.title}</h2>
                  <ArtistNameWithBadge
                    artistName={artwork.artist}
                    artistId={(artwork as Artwork & { artist_id?: string }).artist_id}
                    className="collection-card-artist"
                  />
                  {formatArtworkMeta(artwork) && (
                    <p className="collection-card-meta">{formatArtworkMeta(artwork)}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="collection-list">
            {sortedArtworks.map((artwork) => (
              <article
                key={artwork.id}
                className="collection-list-item"
                onClick={() => onViewInDiscover(artwork)}
              >
                <div className="collection-list-thumb">
                  <img
                    src={artwork.artwork_image || "/placeholder.svg"}
                    alt={artwork.title}
                    className="collection-list-image"
                  />
                </div>
                <div className="collection-list-copy">
                  <h2 className="collection-card-title">{artwork.title}</h2>
                  <ArtistNameWithBadge
                    artistName={artwork.artist}
                    artistId={(artwork as Artwork & { artist_id?: string }).artist_id}
                    className="collection-card-artist"
                  />
                  {formatArtworkMeta(artwork) && (
                    <p className="collection-card-meta">{formatArtworkMeta(artwork)}</p>
                  )}
                </div>
                {renderMenu(artwork)}
              </article>
            ))}
          </div>
        )}

        <p className="collection-footer-hint">
          <Info className="w-4 h-4" />
          Click an artwork to view full details
        </p>
      </div>
    </div>
  )
}
