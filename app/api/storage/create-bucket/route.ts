import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';
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
    const { data: existingBucket } = await supabase
      .storage
      .getBucket('profile-pictures');

    if (!existingBucket) {
      const { data, error } = await supabase
        .storage
        .createBucket('profile-pictures', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        });

      if (error) {
        console.error('Error creating bucket:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ message: 'Bucket created successfully', data });
    }

    return NextResponse.json({ message: 'Bucket already exists', data: existingBucket });
  } catch (error) {
    console.error('Error in create-bucket route:', error);
    return NextResponse.json(
      { error: 'Failed to create bucket' },
      { status: 500 }
    );
  }
} 