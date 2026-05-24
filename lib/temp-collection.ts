import type { Artwork } from "@/types/artwork"

export const TEMP_COLLECTION_KEY = "kaleidorium_temp_collection"

export function loadTempCollection(): Artwork[] {
  try {
    const saved = localStorage.getItem(TEMP_COLLECTION_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function saveTempCollection(items: Artwork[]): void {
  localStorage.setItem(TEMP_COLLECTION_KEY, JSON.stringify(items))
}
