import type { Artwork } from "@/types/artwork"

const TRAINING_ARTIST_NAME = "training data"

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

function isTrainingArtist(artist: string | undefined): boolean {
  return (artist ?? "").trim().toLowerCase() === TRAINING_ARTIST_NAME
}

function artistKey(artist: string | undefined): string {
  const normalized = (artist ?? "").trim().toLowerCase()
  return normalized || "unknown artist"
}

/**
 * Reorders artworks so first-time visitors see variety across artists.
 * - Real artists are interleaved round-robin (one piece per artist before repeating)
 * - Internal training/test artworks are pushed to the end of the deck
 */
export function diversifyDiscoverArtworks(artworks: Artwork[]): Artwork[] {
  if (artworks.length <= 1) return artworks

  const realArtworks = artworks.filter((artwork) => !isTrainingArtist(artwork.artist))
  const trainingArtworks = artworks.filter((artwork) => isTrainingArtist(artwork.artist))

  const byArtist = new Map<string, Artwork[]>()
  for (const artwork of realArtworks) {
    const key = artistKey(artwork.artist)
    const bucket = byArtist.get(key) ?? []
    bucket.push(artwork)
    byArtist.set(key, bucket)
  }

  for (const bucket of byArtist.values()) {
    shuffleInPlace(bucket)
  }

  const artistKeys = shuffleInPlace([...byArtist.keys()])
  const diversified: Artwork[] = []
  let hasMore = true

  while (hasMore) {
    hasMore = false
    for (const key of artistKeys) {
      const bucket = byArtist.get(key)
      if (!bucket || bucket.length === 0) continue
      diversified.push(bucket.shift()!)
      hasMore = true
    }
  }

  return [...diversified, ...shuffleInPlace([...trainingArtworks])]
}
