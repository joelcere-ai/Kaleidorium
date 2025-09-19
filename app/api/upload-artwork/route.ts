import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';
import { uploadRateLimit } from '@/lib/rate-limit';
import { SecureErrors, secureLog } from '@/lib/secure-error-handler';
import { createLogger } from '@/lib/secure-logger';
import { 
  validateSecureArtworkUpload, 
  validateFileUploadSimple, 
  validateProfilePictureOnly,
  uploadSecureArtwork 
} from '@/lib/secure-artwork-upload';
import { validateName, sanitizeText } from '@/lib/validation';
import { verifyAuth } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  // Create logger instance with correlation ID for this request
  const logger = createLogger();
  
  // SECURITY: Apply strict rate limiting for artwork uploads
  const rateLimitResponse = uploadRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Parse form data first to check if this is a temp upload
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const artworkTitle = formData.get('title') as string;
    const tempUploadParam = formData.get('tempUpload');
    
    // Multiple ways to detect temporary uploads during registration
    const tempUpload = tempUploadParam === 'true';
    
    let userId: string;
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // For temporary uploads during registration, use service role key to bypass RLS
    const adminSupabase = tempUpload ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    ) : supabase;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No artwork file provided'
      }, { status: 400 });
    }

    if (!artworkTitle) {
      return NextResponse.json({
        success: false,
        error: 'Artwork title is required'
      }, { status: 400 });
    }

    // Validate artwork title
    const titleValidation = validateName(artworkTitle, 'Artwork title');
    if (!titleValidation.valid) {
      return NextResponse.json({
        success: false,
        error: titleValidation.error || 'Invalid artwork title'
      }, { status: 400 });
    }

    // SIMPLIFIED AUTHENTICATION LOGIC
    if (tempUpload) {
      // For temp uploads during registration, use temporary user ID
      userId = 'temp-upload-' + Date.now();
      
      logger.info('Temporary artwork upload during registration', {
        tempUserId: userId,
        artworkTitle: titleValidation.sanitized,
        fileName: file.name
      });
    } else {
      // For permanent uploads, require authentication
      const authResult = await verifyAuth(request);
      if (authResult instanceof NextResponse) {
        return authResult;
      }
      userId = authResult.user.id;
      
      // Verify user has artist role
      if (!authResult.isAdmin && authResult.userRole !== 'artist') {
        return SecureErrors.authorization({ reason: 'not_artist' });
      }
    }

    logger.info('Artwork upload request', {
      userId,
      artworkTitle: titleValidation.sanitized,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      tempUpload
    });

    // SIMPLIFIED VALIDATION APPROACH
    let secureValidation;
    
    if (tempUpload) {
      // Use minimal validation for temporary uploads during registration
      secureValidation = await validateFileUploadSimple(file, true);
      logger.info('Using minimal validation for temp upload');
    } else {
      // Use comprehensive validation for permanent uploads
      secureValidation = await validateSecureArtworkUpload(file, false);
      logger.info('Using comprehensive validation for permanent upload');
    }
    
    if (!secureValidation.valid || !secureValidation.sanitizedFile) {
      logger.warn('Artwork upload rejected by security validation', {
        userId,
        fileName: file.name,
        artworkTitle: titleValidation.sanitized,
        error: secureValidation.error
      });
      return NextResponse.json({
        success: false,
        error: secureValidation.error || 'Artwork validation failed'
      }, { status: 400 });
    }

    // HANDLE TEMPORARY VS PERMANENT UPLOADS
    if (tempUpload) {
      // For temp uploads, store temporarily and return data URL for immediate use
      logger.info('Processing temporary upload', {
        userId,
        fileName: secureValidation.sanitizedFile.name,
        fileSize: secureValidation.sanitizedFile.size
      });

      try {
        // Try to store in temp storage first
        const fileName = `temp/temp-${Date.now()}-${secureValidation.sanitizedFile.name}`;
        const arrayBuffer = await secureValidation.sanitizedFile.arrayBuffer();
        
        const { data: uploadData, error: uploadError } = await adminSupabase.storage
          .from('artwork-images')
          .upload(fileName, arrayBuffer, {
            contentType: secureValidation.sanitizedFile.type,
            upsert: false
          });

        if (uploadError) {
          logger.warn('Temp upload to storage failed, using data URL fallback', {
            error: uploadError.message
          });
          
          // Fallback to data URL
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const dataUrl = `data:${secureValidation.sanitizedFile.type};base64,${base64}`;
          
          return NextResponse.json({
            success: true,
            message: 'Artwork validated successfully',
            url: dataUrl,
            tempFile: {
              name: secureValidation.sanitizedFile.name,
              size: secureValidation.sanitizedFile.size,
              type: secureValidation.sanitizedFile.type
            },
            metadata: secureValidation.artworkMetadata
          });
        }

        // Get public URL if storage worked
        const { data: publicUrlData } = adminSupabase.storage
          .from('artwork-images')
          .getPublicUrl(fileName);

        return NextResponse.json({
          success: true,
          message: 'Temporary artwork uploaded successfully',
          url: publicUrlData.publicUrl,
          tempFile: {
            name: secureValidation.sanitizedFile.name,
            size: secureValidation.sanitizedFile.size,
            type: secureValidation.sanitizedFile.type,
            tempPath: fileName
          },
          metadata: secureValidation.artworkMetadata
        });

      } catch (error) {
        logger.warn('Temp storage error, using data URL fallback', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // Final fallback to data URL
        const arrayBuffer = await secureValidation.sanitizedFile.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUrl = `data:${secureValidation.sanitizedFile.type};base64,${base64}`;

        return NextResponse.json({
          success: true,
          message: 'Artwork validated successfully',
          url: dataUrl,
          tempFile: {
            name: secureValidation.sanitizedFile.name,
            size: secureValidation.sanitizedFile.size,
            type: secureValidation.sanitizedFile.type
          },
          metadata: secureValidation.artworkMetadata
        });
      }
    }

    // PERMANENT UPLOAD LOGIC (only for authenticated artists)
    const uploadResult = await uploadSecureArtwork(
      adminSupabase, 
      userId, 
      secureValidation.sanitizedFile, 
      titleValidation.sanitized!
    );

    logger.info('Artwork upload completed successfully', {
      userId,
      artworkTitle: titleValidation.sanitized,
      uploadPath: uploadResult.path,
      publicUrl: uploadResult.url
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      path: uploadResult.path,
      metadata: {
        dimensions: secureValidation.artworkMetadata?.dimensions,
        fileSize: secureValidation.artworkMetadata?.fileSize,
        format: secureValidation.artworkMetadata?.format,
        hasEXIF: secureValidation.artworkMetadata?.hasEXIF
      },
      message: 'Artwork uploaded successfully'
    });

  } catch (error) {
    logger.error('Artwork upload failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return SecureErrors.server({ operation: 'artwork_upload' });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 