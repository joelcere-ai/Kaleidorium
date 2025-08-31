import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Track artwork views and interactions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { artwork_id, action, user_id } = body

    // Validate required fields
    if (!artwork_id || !action) {
      return NextResponse.json(
        { error: 'artwork_id and action are required' },
        { status: 400 }
      )
    }

    // Valid actions: 'view', 'lead' (clicked View Artwork Page), 'like', 'dislike', 'add_to_collection'
    const validActions = ['view', 'lead', 'like', 'dislike', 'add_to_collection']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Check if artwork analytics record exists
    const { data: existingAnalytics, error: fetchError } = await supabase
      .from('ArtworkAnalytics')
      .select('*')
      .eq('artwork_id', artwork_id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching analytics:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      )
    }

    const currentData = existingAnalytics || {
      artwork_id,
      views: 0,
      leads: 0,
      likes: 0,
      dislikes: 0,
      adds_to_collection: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Update the appropriate counter
    const updatedData = { ...currentData }
    switch (action) {
      case 'view':
        updatedData.views = (currentData.views || 0) + 1
        break
      case 'lead':
        updatedData.leads = (currentData.leads || 0) + 1
        break
      case 'like':
        updatedData.likes = (currentData.likes || 0) + 1
        break
      case 'dislike':
        updatedData.dislikes = (currentData.dislikes || 0) + 1
        break
      case 'add_to_collection':
        updatedData.adds_to_collection = (currentData.adds_to_collection || 0) + 1
        break
    }

    updatedData.updated_at = new Date().toISOString()

    // Upsert the analytics record
    const { error: upsertError } = await supabase
      .from('ArtworkAnalytics')
      .upsert(updatedData, {
        onConflict: 'artwork_id'
      })

    if (upsertError) {
      console.error('Error updating analytics:', upsertError)
      return NextResponse.json(
        { error: 'Failed to update analytics' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: updatedData })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get analytics for an artwork or all artworks by an artist
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artwork_id = searchParams.get('artwork_id')
    const artist_id = searchParams.get('artist_id')

    if (!artwork_id && !artist_id) {
      return NextResponse.json(
        { error: 'artwork_id or artist_id is required' },
        { status: 400 }
      )
    }

    if (artwork_id) {
      // Get analytics for specific artwork
      const { data, error } = await supabase
        .from('ArtworkAnalytics')
        .select('*')
        .eq('artwork_id', artwork_id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching artwork analytics:', error)
        return NextResponse.json(
          { error: 'Failed to fetch analytics' },
          { status: 500 }
        )
      }

      return NextResponse.json({ data: data || null })
    }

    if (artist_id) {
      // Get analytics for all artworks by an artist
      const { data: artworks, error: artworksError } = await supabase
        .from('Artwork')
        .select('id, artwork_title, medium, artwork_image')
        .eq('artist_id', artist_id)

      if (artworksError) {
        console.error('Error fetching artworks:', artworksError)
        return NextResponse.json(
          { error: 'Failed to fetch artworks' },
          { status: 500 }
        )
      }

      const artworkIds = artworks?.map(a => a.id) || []
      
      if (artworkIds.length === 0) {
        return NextResponse.json({ data: [] })
      }

      const { data: analytics, error: analyticsError } = await supabase
        .from('ArtworkAnalytics')
        .select('*')
        .in('artwork_id', artworkIds)

      if (analyticsError) {
        console.error('Error fetching analytics:', analyticsError)
        return NextResponse.json(
          { error: 'Failed to fetch analytics' },
          { status: 500 }
        )
      }

      // Merge artwork data with analytics
      const mergedData = artworks?.map(artwork => {
        const artworkAnalytics = analytics?.find(a => a.artwork_id === artwork.id)
        return {
          ...artwork,
          views: artworkAnalytics?.views || 0,
          leads: artworkAnalytics?.leads || 0,
          likes: artworkAnalytics?.likes || 0,
          dislikes: artworkAnalytics?.dislikes || 0,
          adds_to_collection: artworkAnalytics?.adds_to_collection || 0
        }
      })

      return NextResponse.json({ data: mergedData })
    }

  } catch (error) {
    console.error('Analytics GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 