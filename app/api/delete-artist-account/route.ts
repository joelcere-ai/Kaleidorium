import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse, NextRequest } from 'next/server'
import { verifyResourceOwnership } from '@/lib/auth-middleware'
import { Database } from '@/lib/supabase-types'
import { deleteAccountRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // SECURITY: Apply strict rate limiting for account deletion
  const rateLimitResponse = deleteAccountRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // SECURITY: Verify the requesting user owns this account or is admin
    const authResult = await verifyResourceOwnership(request, userId)
    
    // If auth verification failed, return the error response
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Use authenticated client with elevated permissions for some operations
    const supabase = createRouteHandlerClient<Database>({ cookies })

    console.log(`Starting comprehensive artist account deletion for user: ${userId} (requested by: ${authResult.user.id})`)

    // 1. Get all artworks by this artist to know what to clean up from collections
    const { data: artistArtworks, error: fetchArtworksError } = await supabase
      .from('Artwork')
      .select('id, artwork_image')
      .eq('artist_id', userId)

    if (fetchArtworksError) {
      console.error('Error fetching artist artworks:', fetchArtworksError)
      return NextResponse.json({ error: 'Failed to fetch artist artworks' }, { status: 500 })
    }

    const artworkIds = artistArtworks?.map(artwork => artwork.id) || []
    console.log(`Found ${artworkIds.length} artworks to clean up`)

    // 2. Remove all these artworks from all users' collections
    if (artworkIds.length > 0) {
      const { error: collectionDeleteError } = await supabase
        .from('Collection')
        .delete()
        .in('artwork_id', artworkIds)

      if (collectionDeleteError) {
        console.error('Error removing artworks from collections:', collectionDeleteError)
        return NextResponse.json({ error: 'Failed to remove artworks from collections' }, { status: 500 })
      }
      console.log(`Removed ${artworkIds.length} artworks from all user collections`)
    }

    // 3. Delete artwork images from storage
    if (artistArtworks && artistArtworks.length > 0) {
      const imagesToDelete = artistArtworks
        .filter(artwork => artwork.artwork_image)
        .map(artwork => {
          try {
            const url = new URL(artwork.artwork_image!)
            const pathParts = url.pathname.split('/')
            return pathParts[pathParts.length - 1]
          } catch (e) {
            console.warn(`Failed to parse artwork image URL: ${artwork.artwork_image}`)
            return null
          }
        })
        .filter(Boolean) as string[]

      if (imagesToDelete.length > 0) {
        const { error: storageDeleteError } = await supabase.storage
          .from('artwork-images')
          .remove(imagesToDelete)
        
        if (storageDeleteError) {
          console.warn('Some artwork images could not be deleted from storage:', storageDeleteError)
          // Don't fail the whole operation for storage cleanup issues
        } else {
          console.log(`Deleted ${imagesToDelete.length} artwork images from storage`)
        }
      }
    }

    // 4. Delete all artwork records
    if (artworkIds.length > 0) {
      const { error: artworkDeleteError } = await supabase
        .from('Artwork')
        .delete()
        .eq('artist_id', userId)

      if (artworkDeleteError) {
        console.error('Error deleting artworks:', artworkDeleteError)
        return NextResponse.json({ error: 'Failed to delete artworks' }, { status: 500 })
      }
      console.log('Deleted all artist artworks')
    }

    // 5. Get artist profile picture info for cleanup
    const { data: artistData } = await supabase
      .from('Artists')
      .select('profilepix')
      .eq('id', userId)
      .single()

    // 6. Delete artist profile picture from storage (if exists)
    if (artistData?.profilepix) {
      try {
        const url = new URL(artistData.profilepix)
        const pathParts = url.pathname.split('/')
        const fileName = pathParts[pathParts.length - 1]
        
        const { error: profilePicError } = await supabase.storage
          .from('profile-pictures')
          .remove([fileName])
        
        if (profilePicError) {
          console.warn(`Failed to delete profile picture: ${fileName}`, profilePicError)
        }
      } catch (e) {
        console.warn(`Failed to parse profile picture URL: ${artistData.profilepix}`)
      }
    }

    // 7. Delete from Artists table
    const { error: artistDeleteError } = await supabase
      .from('Artists')
      .delete()
      .eq('id', userId)

    if (artistDeleteError) {
      console.error('Error deleting artist profile:', artistDeleteError)
      return NextResponse.json({ error: 'Failed to delete artist profile' }, { status: 500 })
    }
    console.log('Deleted artist profile')

    // 8. Delete from Collectors table (artists also have collector profiles)
    const { error: collectorDeleteError } = await supabase
      .from('Collectors')
      .delete()
      .eq('user_id', userId)

    if (collectorDeleteError) {
      console.error('Error deleting collector profile:', collectorDeleteError)
      return NextResponse.json({ error: 'Failed to delete collector profile' }, { status: 500 })
    }
    console.log('Deleted collector profile')

    // 9. Delete any invitations associated with this user (cleanup)
    try {
      const { data: { user: userToDelete } } = await supabase.auth.getUser()
      if (userToDelete && userToDelete.id === userId) {
        // Only clean up invitations if we can get the user email
        const { error: invitationDeleteError } = await supabase
          .from('Invitations')
          .delete()
          .eq('email', userToDelete.email)

        if (invitationDeleteError) {
          console.warn('Error deleting invitations:', invitationDeleteError)
          // Don't fail the whole operation for this
        }
      }
    } catch (e) {
      console.warn('Could not clean up invitations:', e)
    }

    // 10. Sign out the user (if they're deleting their own account)
    if (authResult.user.id === userId) {
      await supabase.auth.signOut()
    }

    console.log(`Successfully completed comprehensive account deletion for user: ${userId}`)
    return NextResponse.json({ 
      success: true, 
      message: 'Artist account and all associated data have been permanently deleted',
      details: {
        artworksDeleted: artworkIds.length,
        collectionsUpdated: true
      }
    })

  } catch (error: any) {
    console.error('Artist account deletion error:', error)
    return NextResponse.json({ 
      error: 'Internal server error during artist account deletion' 
    }, { status: 500 })
  }
} 