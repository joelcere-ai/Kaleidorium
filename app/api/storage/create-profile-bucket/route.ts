import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { verifyAdmin } from '@/lib/auth-middleware';
import { Database } from '@/lib/supabase-types';

export async function POST(request: NextRequest) {
  // SECURITY: Only admins should be able to create storage buckets
  const authResult = await verifyAdmin(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const supabase = createRouteHandlerClient<Database>({ cookies });
  try {
    // Check if profile-pictures bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return NextResponse.json({ error: 'Failed to list buckets' }, { status: 500 });
    }

    const profileBucketExists = buckets?.some(bucket => bucket.name === 'profile-pictures');

    if (!profileBucketExists) {
      // Create the profile-pictures bucket
      const { data, error: createError } = await supabase.storage.createBucket('profile-pictures', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png'],
        fileSizeLimit: 1048576, // 1MB
      });

      if (createError) {
        console.error('Error creating profile-pictures bucket:', createError);
        return NextResponse.json({ error: 'Failed to create profile-pictures bucket' }, { status: 500 });
      }

      console.log('Profile-pictures bucket created successfully');
    }

    return NextResponse.json({ 
      success: true, 
      message: profileBucketExists ? 'Profile-pictures bucket already exists' : 'Profile-pictures bucket created successfully' 
    });

  } catch (error) {
    console.error('Unexpected error in create-profile-bucket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 