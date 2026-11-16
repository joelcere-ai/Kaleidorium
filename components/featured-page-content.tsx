"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Info, MoreVertical } from "lucide-react"
import { ArtistNameWithBadge } from "@/components/artist-name-with-badge"
import { ImageOverlay } from "@/components/image-overlay"
import { stashPendingDiscoverArtwork } from "@/lib/discover-deep-link"
import { FEATURED_ARTIST, fetchFeaturedArtistArtworks } from "@/lib/featured-artist"
import type { Artwork } from "@/types/artwork"

function formatArtworkMeta(artwork: Artwork) {
  const parts = [artwork.year, artwork.medium].filter(Boolean)
  return parts.join(" · ")
}

export function FeaturedPageContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [overlayImage, setOverlayImage] = useState<{ url: string; alt: string } | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const loaded = await fetchFeaturedArtistArtworks()
      if (!cancelled) {
        setArtworks(loaded)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const openArtworkInDiscover = (artwork: Artwork) => {
    const artworkId = String(artwork.id).split("_")[0]
    stashPendingDiscoverArtwork(artwork)
    router.push(`/?artworkId=${encodeURIComponent(artworkId)}`)
  }

  const openImageOverlay = (artwork: Artwork) => {
    if (!artwork.artwork_image) return
    setOverlayImage({ url: artwork.artwork_image, alt: artwork.title })
  }

  const closeImageOverlay = () => {
    setOverlayImage(null)
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
            className="collection-card-menu-item"
            onClick={(event) => {
              event.stopPropagation()
              setOpenMenuId(null)
              openArtworkInDiscover(artwork)
            }}
          >
            <Info className="w-4 h-4" />
            View details
          </button>
        </div>
      )}
    </div>
  )

  const heroImage = artworks[0]?.artwork_image

  return (
    <div className="featured-page">
      <div className="featured-page-inner">
        <header className="featured-page-header">
          <p className="featured-page-eyebrow">Featured artist</p>
        </header>

        <section className="featured-artist-hero">
          {heroImage && (
            <div className="featured-artist-hero-image-wrap">
              <img
                src={heroImage}
                alt={`Artwork by ${FEATURED_ARTIST.fullName}`}
                className="featured-artist-hero-image"
              />
            </div>
          )}
          <div className="featured-artist-intro">
            <h2 className="featured-artist-name">{FEATURED_ARTIST.fullName}</h2>
            <div className="featured-artist-copy">
              {FEATURED_ARTIST.introParagraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="featured-artworks-section">
          <div className="featured-artworks-heading">
            <h2 className="featured-artworks-title">Works on Kaleidorium</h2>
            {!loading && (
              <p className="featured-artworks-count">
                {artworks.length} artwork{artworks.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {loading ? (
            <p className="featured-page-loading">Loading artworks…</p>
          ) : artworks.length === 0 ? (
            <div className="featured-page-empty">
              <p>Artworks by {FEATURED_ARTIST.displayName} will appear here soon.</p>
            </div>
          ) : (
            <>
              <div className="collection-grid">
                {artworks.map((artwork) => (
                  <article key={artwork.id} className="collection-card">
                    <div
                      className="collection-card-image-wrap collection-card-image-wrap--zoom"
                      onClick={() => openImageOverlay(artwork)}
                      role="button"
                      tabIndex={0}
                      aria-label={`View ${artwork.title} full size`}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          openImageOverlay(artwork)
                        }
                      }}
                    >
                      <img
                        src={artwork.artwork_image || "/placeholder.svg"}
                        alt={artwork.title}
                        className="collection-card-image"
                      />
                      {renderMenu(artwork)}
                    </div>
                    <div className="collection-card-body">
                      <h3 className="collection-card-title">{artwork.title}</h3>
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
              <p className="collection-footer-hint">
                <Info className="w-4 h-4" />
                Tap an artwork to zoom · Use the menu to view in Discover
              </p>
            </>
          )}
        </section>
      </div>

      {overlayImage && (
        <ImageOverlay
          artwork_image={overlayImage.url}
          alt={overlayImage.alt}
          onClose={closeImageOverlay}
        />
      )}
    </div>
  )
}
