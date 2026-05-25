import { supabase } from "@/lib/supabase"
import { transformSupabaseArtwork } from "@/lib/search-artworks"
import type { Artwork } from "@/types/artwork"

export interface CuratedCollectionRow {
  id: string
  theme_title: string
  description: string
  artwork_ids: number[] | string[]
  month: string
  created_at: string
}

/** First day of the current calendar month (UTC), e.g. 2026-05-01 */
export function currentMonthKey(): string {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, "0")
  return `${y}-${m}-01`
}

export function formatMonthLabel(monthIso: string): string {
  const d = new Date(monthIso + "T12:00:00Z")
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })
}

export async function fetchCurrentCuratedCollection(): Promise<CuratedCollectionRow | null> {
  const month = currentMonthKey()
  const { data, error } = await supabase
    .from("curated_collections")
    .select("id, theme_title, description, artwork_ids, month, created_at")
    .eq("month", month)
    .maybeSingle()

  if (error) {
    console.error("[curated_collections] fetch error:", error)
    return null
  }
  return data as CuratedCollectionRow | null
}

export async function fetchArtworksByIds(ids: (number | string)[]): Promise<Artwork[]> {
  if (!ids.length) return []
  const numericIds = ids.map((id) => Number(id)).filter((id) => !Number.isNaN(id))
  const { data, error } = await supabase
    .from("Artwork")
    .select("*")
    .in("id", numericIds)

  if (error || !data) {
    console.error("[curated_collections] artwork fetch error:", error)
    return []
  }

  const byId = new Map(
    data.map((row) => [String(row.id), transformSupabaseArtwork(row as Record<string, unknown>)])
  )
  return numericIds
    .map((id) => byId.get(String(id)))
    .filter((a): a is Artwork => Boolean(a))
}
