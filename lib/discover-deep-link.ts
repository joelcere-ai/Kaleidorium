import type { Artwork } from "@/types/artwork"

export const PENDING_DISCOVER_ARTWORK_KEY = "kaleidorium_pending_discover_artwork"

export function artworkIdKey(id: string | number | undefined): string {
  if (id == null) return ""
  return String(id).split("_")[0]
}

export function stashPendingDiscoverArtwork(artwork: Artwork): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(PENDING_DISCOVER_ARTWORK_KEY, JSON.stringify(artwork))
  } catch {
    // ignore quota / private mode errors
  }
}

export function peekPendingDiscoverArtwork(targetArtworkId: string): Artwork | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(PENDING_DISCOVER_ARTWORK_KEY)
    if (!raw) return null
    const artwork = JSON.parse(raw) as Artwork
    if (artworkIdKey(artwork.id) === artworkIdKey(targetArtworkId)) {
      return artwork
    }
  } catch {
    // ignore parse errors
  }
  return null
}

export function consumePendingDiscoverArtwork(targetArtworkId: string): Artwork | null {
  const artwork = peekPendingDiscoverArtwork(targetArtworkId)
  if (!artwork || typeof window === "undefined") return null
  try {
    sessionStorage.removeItem(PENDING_DISCOVER_ARTWORK_KEY)
  } catch {
    // ignore
  }
  return artwork
}

export function getArtworkIdFromUrl(): string | null {
  if (typeof window === "undefined") return null
  return new URLSearchParams(window.location.search).get("artworkId")
}

export function getInitialDeepLinkArtworks(): Artwork[] {
  const urlId = getArtworkIdFromUrl()
  if (!urlId) return []
  const pending = peekPendingDiscoverArtwork(urlId)
  return pending ? [pending] : []
}
