"use client"

import { useRouter } from "next/navigation"
import { DiscoverSearchBar } from "@/components/discover-search-bar"
import { useArtworkSearch } from "@/contexts/artwork-search-context"
import { stashPendingDiscoverArtwork } from "@/lib/discover-deep-link"
import type { Artwork } from "@/types/artwork"

interface GlobalArtworkSearchProps {
  /** Discover renders its own search bar inside the feed. */
  hideBar?: boolean
}

export function GlobalArtworkSearchBar({ hideBar = false }: GlobalArtworkSearchProps) {
  const {
    input,
    setInput,
    submitSearch,
    clearSearch,
    query,
    loading,
    error,
    isBarOpen,
  } = useArtworkSearch()

  if (hideBar || !isBarOpen) return null

  return (
    <DiscoverSearchBar
      value={input}
      onChange={setInput}
      onSubmit={submitSearch}
      onClear={clearSearch}
      activeQuery={query || null}
      isLoading={loading}
      error={error}
    />
  )
}

export function GlobalArtworkSearchResults() {
  const router = useRouter()
  const { query, results, loading, error, hasActiveSearch, clearSearch, closeSearchBar } =
    useArtworkSearch()

  if (!hasActiveSearch) return null

  const goToArtworkInDiscover = (artwork: Artwork) => {
    clearSearch()
    closeSearchBar()
    stashPendingDiscoverArtwork(artwork)
    router.push(`/?artworkId=${encodeURIComponent(artwork.id)}`)
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto discover-feed-bg">
      <div className="discover-feed-container py-6">
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#E6E4DF] border-t-[#1E1E1C] rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center p-6 bg-white border border-[#E6E4DF] rounded-[16px]">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="text-center p-6 bg-white border border-[#E6E4DF] rounded-[16px]">
            <p className="text-sm text-[#5F5F5A]">
              No artwork found for &ldquo;{query}&rdquo;. Try a different search.
            </p>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {results.map((artwork) => (
              <button
                key={artwork.id}
                type="button"
                className="discover-mobile-card text-left overflow-hidden cursor-pointer"
                onClick={() => goToArtworkInDiscover(artwork)}
              >
                <div className="discover-mobile-artwork-frame !h-72">
                  <img
                    src={artwork.artwork_image || "/placeholder.svg"}
                    alt={artwork.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="discover-mobile-card-body">
                  <h2 className="discover-mobile-title">{artwork.title}</h2>
                  <p className="discover-mobile-artist">{artwork.artist}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
