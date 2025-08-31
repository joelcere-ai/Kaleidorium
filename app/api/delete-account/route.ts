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

    // Use authenticated client instead of service role for user operations
    const supabase = createRouteHandlerClient<Database>({ cookies })

    console.log(`Starting account deletion for user: ${userId} (requested by: ${authResult.user.id})`)

    // First, check if this user is an artist
    const { data: artistCheck } = await supabase
      .from('Artists')
      .select('id')
      .eq('id', userId)
      .single()

    if (artistCheck) {
      console.log('User is an artist, performing comprehensive artist deletion')
      
      // Call the artist-specific deletion logic
      const artistDeletionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/delete-artist-account`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Forward the authorization
          'Authorization': request.headers.get('Authorization') || '',
          'Cookie': request.headers.get('Cookie') || ''
        },
        body: JSON.stringify({ userId })
      })

      if (!artistDeletionResponse.ok) {
        const error = await artistDeletionResponse.json()
        return NextResponse.json({ error: error.error || 'Failed to delete artist account' }, { status: 500 })
      }

      const result = await artistDeletionResponse.json()
      return NextResponse.json(result)
    }
    
    console.log('User is a collector, performing collector deletion')
    
    // Handle collector deletion with authenticated client
    // 1. Get collector's profile picture info for cleanup
    const { data: collectorData } = await supabase
      .from('Collectors')
      .select('profilepix')
      .eq('user_id', userId)
      .single()

    // 2. Delete from user's collection
    const { error: collectionDeleteError } = await supabase
      .from('Collection')
      .delete()
      .eq('user_id', userId)

    if (collectionDeleteError) {
      console.error('Error deleting user collection:', collectionDeleteError)
      return NextResponse.json({ error: 'Failed to delete user collection' }, { status: 500 })
    }

    // 3. Delete from Collectors table
    const { error: collectorDeleteError } = await supabase
      .from('Collectors')
      .delete()
      .eq('user_id', userId)

    if (collectorDeleteError) {
      console.error('Error deleting collector profile:', collectorDeleteError)
      return NextResponse.json({ error: 'Failed to delete collector profile' }, { status: 500 })
    }

    // 4. Handle profile picture deletion (if exists)
    if (collectorData?.profilepix) {
      try {
        const url = new URL(collectorData.profilepix)
        const pathParts = url.pathname.split('/')
        const fileName = pathParts[pathParts.length - 1]
        
        const { error: profilePicError } = await supabase.storage
          .from('profile-pictures')
          .remove([fileName])
        
        if (profilePicError) {
          console.warn(`Failed to delete profile picture: ${fileName}`, profilePicError)
        }
      } catch (e) {
        console.warn(`Failed to parse profile picture URL: ${collectorData.profilepix}`)
      }
    }

    // 5. Sign out the user (if they're deleting their own account)
    if (authResult.user.id === userId) {
      await supabase.auth.signOut()
    }

    console.log(`Successfully completed collector account deletion for user: ${userId}`)
    return NextResponse.json({ 
      success: true, 
      message: 'Account deleted successfully' 
    })

  } catch (error: any) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ 
      error: 'Internal server error during account deletion' 
    }, { status: 500 })
  }
} 