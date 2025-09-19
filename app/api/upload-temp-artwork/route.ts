import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({
        success: false,
        error: 'Title is required'
      }, { status: 400 });
    }

    // Basic file validation
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({
        success: false,
        error: 'Please upload an image file'
      }, { status: 400 });
    }

    // File size check (5MB for temp uploads)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: 'File size must be less than 5MB'
      }, { status: 400 });
    }

    // Create admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create simple filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `temp/registration-${timestamp}.${fileExtension}`;

    try {
      // Upload to Supabase storage
      const arrayBuffer = await file.arrayBuffer();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('artwork-images')
        .upload(fileName, arrayBuffer, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        
        // Fallback to data URL
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;
        
        return NextResponse.json({
          success: true,
          url: dataUrl,
          message: 'Artwork uploaded successfully (local storage)'
        });
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('artwork-images')
        .getPublicUrl(fileName);

      return NextResponse.json({
        success: true,
        url: publicUrlData.publicUrl,
        message: 'Artwork uploaded successfully'
      });

    } catch (error) {
      console.error('Upload process error:', error);
      
      // Final fallback - return data URL
      try {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;
        
        return NextResponse.json({
          success: true,
          url: dataUrl,
          message: 'Artwork processed successfully'
        });
      } catch (fallbackError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to process artwork'
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error occurred'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
