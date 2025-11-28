import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const searchTerm = searchParams.get('q')

    if (!searchTerm || !searchTerm.trim()) {
      return NextResponse.json(
        { error: 'Search term is required' },
        { status: 400 }
      )
    }

    const term = searchTerm.trim()

    // Search by title
    const { data: byTitle, error: titleError } = await supabase
      .from('Artwork')
      .select('*')
      .ilike('artwork_title', `%${term}%`)
      .limit(50)

    if (titleError) {
      console.error('Error searching by title:', titleError)
    }

    // Search by artist
    const { data: byArtist, error: artistError } = await supabase
      .from('Artwork')
      .select('*')
      .ilike('artist', `%${term}%`)
      .limit(50)

    if (artistError) {
      console.error('Error searching by artist:', artistError)
    }

    // Combine and deduplicate
    const allResults: any[] = []
    const seenIds = new Set<number>()

    if (byTitle) {
      byTitle.forEach((art: any) => {
        if (!seenIds.has(art.id)) {
          seenIds.add(art.id)
          allResults.push(art)
        }
      })
    }

    if (byArtist) {
      byArtist.forEach((art: any) => {
        if (!seenIds.has(art.id)) {
          seenIds.add(art.id)
          allResults.push(art)
        }
      })
    }

    // Transform to match Artwork interface
    const transformedResults = allResults.map((artwork: any) => ({
      id: artwork.id.toString(),
      title: artwork.artwork_title || '',
      artist: artwork.artist || '',
      medium: artwork.medium || '',
      dimensions: artwork.dimensions || '',
      year: artwork.year || '',
      price: artwork.price || '',
      currency: artwork.currency || undefined,
      description: artwork.description || '',
      tags: artwork.tags || [],
      artwork_image: artwork.artwork_image || '',
      created_at: artwork.created_at || '',
      updated_at: artwork.updated_at || '',
      link: artwork.link || undefined,
      style: artwork.style || undefined,
      genre: artwork.genre || undefined,
      subject: artwork.subject || undefined,
      colour: artwork.colour || undefined,
    }))

    return NextResponse.json({
      results: transformedResults,
      count: transformedResults.length,
      searchTerm: term
    })

  } catch (error: any) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

