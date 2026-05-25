import { supabase } from "@/lib/supabase"
import type { Artwork } from "@/types/artwork"

const WEIGHTS = {
  ADD: 2.0,
  LIKE: 1.0,
  DISLIKE: -2.5,
}

type PreferenceAction = "add" | "like" | "dislike"

type Preferences = {
  artists: Record<string, number>
  genres: Record<string, number>
  styles: Record<string, number>
  subjects: Record<string, number>
  colors: Record<string, number>
  priceRanges: Record<string, number>
  interactionCount: number
  viewed_artworks: string[]
}

/** Update collector preferences in Supabase (logged-in users). */
export async function updateUserArtworkPreferences(
  userId: string,
  artwork: Artwork,
  action: PreferenceAction
): Promise<boolean> {
  try {
    const weight =
      action === "add" ? WEIGHTS.ADD : action === "like" ? WEIGHTS.LIKE : WEIGHTS.DISLIKE

    const { data: collector, error: fetchError } = await supabase
      .from("Collectors")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("updateUserArtworkPreferences fetch:", fetchError)
      return false
    }

    const preferences: Preferences = (collector?.preferences as Preferences) || {
      artists: {},
      genres: {},
      styles: {},
      subjects: {},
      colors: {},
      priceRanges: {},
      interactionCount: 0,
      viewed_artworks: [],
    }

    if (!preferences.viewed_artworks.includes(artwork.id)) {
      preferences.viewed_artworks.push(artwork.id)
    }

    const updateCount = (
      category: keyof Pick<
        Preferences,
        "artists" | "genres" | "styles" | "subjects" | "colors" | "priceRanges"
      >,
      value: string | undefined
    ) => {
      if (!value) return
      const categoryMap = { ...preferences[category] }
      categoryMap[value] = (categoryMap[value] || 0) + weight
      preferences[category] = categoryMap as Preferences[typeof category]
    }

    if (action === "dislike") {
      updateCount("genres", artwork.genre)
      updateCount("styles", artwork.style)
      updateCount("subjects", artwork.subject)
      updateCount("colors", artwork.colour)
    } else {
      updateCount("artists", artwork.artist)
      updateCount("genres", artwork.genre)
      updateCount("styles", artwork.style)
      updateCount("subjects", artwork.subject)
      updateCount("colors", artwork.colour)
    }

    const priceValue = parseFloat((artwork.price || "").replace(/[^0-9.-]+/g, ""))
    if (!Number.isNaN(priceValue)) {
      const priceRange = Math.floor(priceValue / 1000) * 1000
      updateCount("priceRanges", priceRange.toString())
    }

    preferences.interactionCount = (preferences.interactionCount || 0) + 1

    const updateData = {
      id: collector?.id || userId,
      user_id: userId,
      preferences,
      last_interaction: new Date().toISOString(),
      created_at: collector?.created_at || new Date().toISOString(),
    }

    const { error: upsertError } = await supabase
      .from("Collectors")
      .upsert(updateData, { onConflict: "id", ignoreDuplicates: false })

    if (upsertError) {
      console.error("updateUserArtworkPreferences upsert:", upsertError)
      return false
    }
    return true
  } catch (e) {
    console.error("updateUserArtworkPreferences:", e)
    return false
  }
}

export async function addArtworkToUserCollection(
  userId: string,
  artwork: Artwork
): Promise<boolean> {
  const { data: existing, error: checkError } = await supabase
    .from("Collection")
    .select("id")
    .eq("user_id", userId)
    .eq("artwork_id", Number(artwork.id))
    .maybeSingle()

  if (checkError) {
    console.error("addArtworkToUserCollection check:", checkError)
    return false
  }
  if (existing) return true

  const { error: insertError } = await supabase
    .from("Collection")
    .insert({ user_id: userId, artwork_id: Number(artwork.id) })

  if (insertError) {
    console.error("addArtworkToUserCollection insert:", insertError)
    return false
  }
  return true
}
