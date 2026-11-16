import { supabase } from "@/lib/supabase"
import { transformSupabaseArtwork } from "@/lib/search-artworks"
import type { Artwork } from "@/types/artwork"

export const FEATURED_ARTIST = {
  displayName: "Lisa Wong",
  fullName: "Lisa Wong Sook Kuan",
  introParagraphs: [
    "Lisa Wong Sook Kuan is a contemporary Malaysian fine artist known for her richly colored, surrealist Peranaka-inspired paintings of imaginary interiors and tropical foliage.",
    "Born in 1992, she graduated with a Bachelor of Fine Arts in Illustration from the California College of the Arts in San Francisco. Her work features “haphazardly” arranged interiors, goldfish drifting through space, and dense tropical foliage. She transforms mundane everyday items like garden weeds, birthday cakes, or pets into fantastical, otherworldly forms on canvas.",
    "She has showcased her art internationally, including exhibitions in the United States, Spain, Hong Kong, and Malaysia.",
  ],
} as const

export async function fetchFeaturedArtistArtworks(): Promise<Artwork[]> {
  const { data, error } = await supabase
    .from("Artwork")
    .select("*")
    .or(
      "artist.ilike.%Lisa Wong%,artist.ilike.%LisaWong%,artist.ilike.%Lisa Wong Sook Kuan%"
    )
    .order("created_at", { ascending: false })

  if (error || !data) {
    console.error("[featured-artist] artwork fetch error:", error)
    return []
  }

  return data.map((row) => transformSupabaseArtwork(row as Record<string, unknown>))
}
