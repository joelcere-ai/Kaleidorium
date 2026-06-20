import { supabase } from "@/lib/supabase"
import type { TastePreferences } from "@/lib/taste-profile"

export const TEMP_PREFERENCES_KEY = "kaleidorium_temp_preferences"

export function emptyPreferences(): TastePreferences {
  return {
    artists: {},
    genres: {},
    styles: {},
    subjects: {},
    colors: {},
    priceRanges: {},
    interactionCount: 0,
    viewed_artworks: [],
  }
}

export function normalizePreferences(
  prefs: Partial<TastePreferences> | null | undefined
): TastePreferences {
  if (!prefs) return emptyPreferences()
  return {
    artists: prefs.artists ?? {},
    genres: prefs.genres ?? {},
    styles: prefs.styles ?? {},
    subjects: prefs.subjects ?? {},
    colors: prefs.colors ?? {},
    priceRanges: prefs.priceRanges ?? {},
    interactionCount: prefs.interactionCount ?? 0,
    viewed_artworks: prefs.viewed_artworks ?? [],
  }
}

export function hasTasteSignals(prefs: TastePreferences | null | undefined): boolean {
  if (!prefs) return false
  return (
    prefs.interactionCount > 0 ||
    Object.keys(prefs.styles).length > 0 ||
    Object.keys(prefs.genres).length > 0 ||
    prefs.viewed_artworks.length > 0
  )
}

export function loadTempPreferences(): TastePreferences | null {
  if (typeof window === "undefined") return null
  try {
    const saved = localStorage.getItem(TEMP_PREFERENCES_KEY)
    if (!saved) return null
    const parsed = JSON.parse(saved) as Partial<TastePreferences>
    const normalized = normalizePreferences(parsed)
    return hasTasteSignals(normalized) ? normalized : null
  } catch {
    return null
  }
}

export function saveTempPreferences(prefs: TastePreferences): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(TEMP_PREFERENCES_KEY, JSON.stringify(normalizePreferences(prefs)))
  } catch {
    // Ignore quota / private browsing errors
  }
}

export function clearTempPreferences(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(TEMP_PREFERENCES_KEY)
  } catch {
    // Ignore
  }
}

function mergeScoreMaps(
  a: Record<string, number>,
  b: Record<string, number>
): Record<string, number> {
  const out = { ...a }
  for (const [key, value] of Object.entries(b)) {
    out[key] = (out[key] || 0) + value
  }
  return out
}

export function mergePreferences(
  existing: TastePreferences,
  incoming: TastePreferences
): TastePreferences {
  return {
    artists: mergeScoreMaps(existing.artists, incoming.artists),
    genres: mergeScoreMaps(existing.genres, incoming.genres),
    styles: mergeScoreMaps(existing.styles, incoming.styles),
    subjects: mergeScoreMaps(existing.subjects, incoming.subjects),
    colors: mergeScoreMaps(existing.colors, incoming.colors),
    priceRanges: mergeScoreMaps(existing.priceRanges, incoming.priceRanges),
    interactionCount: (existing.interactionCount || 0) + (incoming.interactionCount || 0),
    viewed_artworks: [
      ...new Set([...(existing.viewed_artworks || []), ...(incoming.viewed_artworks || [])]),
    ],
  }
}

/** Move anonymous taste profile from localStorage into the user's Collectors row. */
export async function migrateTempPreferencesToDb(userId: string): Promise<boolean> {
  const temp = loadTempPreferences()
  if (!temp) return false

  const { data: collector, error: fetchError } = await supabase
    .from("Collectors")
    .select("id, preferences")
    .eq("user_id", userId)
    .maybeSingle()

  if (fetchError) {
    console.error("migrateTempPreferencesToDb: fetch error", fetchError)
    return false
  }

  if (!collector) return false

  const existing = normalizePreferences(collector.preferences as Partial<TastePreferences>)
  const merged = hasTasteSignals(existing)
    ? mergePreferences(existing, temp)
    : temp

  const { error: updateError } = await supabase
    .from("Collectors")
    .update({ preferences: merged })
    .eq("user_id", userId)

  if (updateError) {
    console.error("migrateTempPreferencesToDb: update error", updateError)
    return false
  }

  clearTempPreferences()
  return true
}
