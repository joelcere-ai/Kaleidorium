import { supabase } from './supabase';

// Cache for founding artist IDs to avoid repeated database queries
let foundingArtistIds: Set<string> | null = null;
let lastCacheUpdate: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get the founding artist IDs from the Artists table
 * Uses the founding_artist field for better performance
 * Results are cached for 5 minutes to improve performance
 */
export async function getFoundingArtistIds(): Promise<Set<string>> {
  const now = Date.now();
  
  // Return cached data if it's still fresh
  if (foundingArtistIds && (now - lastCacheUpdate) < CACHE_DURATION) {
    return foundingArtistIds;
  }

  try {
    const { data: artists, error } = await supabase
      .from('Artists')
      .select('id')
      .eq('founding_artist', true);

    if (error) {
      console.error('Error fetching founding artists:', error);
      // Fallback to old method if founding_artist field doesn't exist yet
      return await getFoundingArtistIdsFallback();
    }

    // Convert to Set for fast lookup
    foundingArtistIds = new Set(artists?.map(artist => artist.id) || []);
    lastCacheUpdate = now;
    
    console.log(`Founding artists loaded: ${foundingArtistIds.size} artists`);
    return foundingArtistIds;
  } catch (error) {
    console.error('Error in getFoundingArtistIds:', error);
    // Fallback to old method if there's an error
    return await getFoundingArtistIdsFallback();
  }
}

/**
 * Fallback method to get first 100 artists by created_at
 * Used if the founding_artist field is not yet available
 */
async function getFoundingArtistIdsFallback(): Promise<Set<string>> {
  try {
    const { data: artists, error } = await supabase
      .from('Artists')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error fetching founding artists (fallback):', error);
      return new Set();
    }

    const artistIds = new Set(artists?.map(artist => artist.id) || []);
    console.log(`Founding artists loaded (fallback): ${artistIds.size} artists`);
    return artistIds;
  } catch (error) {
    console.error('Error in getFoundingArtistIdsFallback:', error);
    return new Set();
  }
}

/**
 * Check if an artist is in the first 100 founding artists
 * @param artistId - The artist's user ID
 * @returns Promise<boolean> - True if the artist is a founding artist
 */
export async function isFoundingArtist(artistId: string): Promise<boolean> {
  if (!artistId) return false;
  
  const foundingIds = await getFoundingArtistIds();
  return foundingIds.has(artistId);
}

/**
 * Clear the cache (useful for testing or when you know data has changed)
 */
export function clearFoundingArtistCache(): void {
  foundingArtistIds = null;
  lastCacheUpdate = 0;
}
