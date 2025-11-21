import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';
import { uploadRateLimit } from '@/lib/rate-limit';
import { SecureErrors, secureLog } from '@/lib/secure-error-handler';
import { processSecureUpload } from '@/lib/secure-file-upload';
import { uploadProfilePicture } from '@/lib/image-utils';
import { verifyAuth } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  // SECURITY: Apply strict rate limiting for file uploads
  const rateLimitResponse = uploadRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // SECURITY: Enhanced authentication with role verification
    const authResult = await verifyAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult.user.id;
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userType = formData.get('userType') as 'collector' | 'artist' | 'gallery' || 'collector';

    if (!file) {
      return SecureErrors.validation('No file provided');
    }

    secureLog('info', 'Profile picture upload request', {
      userId,
      userType,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type
    });

    // SECURITY: Comprehensive file validation and malware scanning
    const secureValidation = await processSecureUpload(file, userId, false);
    
    if (!secureValidation.valid || !secureValidation.sanitizedFile) {
      secureLog('warn', 'File upload rejected by security validation', {
        userId,
        fileName: file.name,
        error: secureValidation.error,
        securityFlags: secureValidation.securityFlags
      });
      return SecureErrors.validation(secureValidation.error || 'File validation failed');
    }

    // SECURITY: Enhanced role-based access control with database verification
    if (userType === 'artist' || userType === 'gallery') {
      // Verify user has artist or gallery role
      if (!authResult.isAdmin && authResult.userRole !== 'artist' && authResult.userRole !== 'gallery') {
        return SecureErrors.authorization({ reason: userType === 'gallery' ? 'not_gallery' : 'not_artist' });
      }
      
      // Additional database verification for non-admin users
      if (!authResult.isAdmin) {
        const { data: artistCheck } = await supabase
          .from('Artists')
          .select('id, is_gallery')
          .eq('id', userId)
          .single();
          
        if (!artistCheck) {
          return SecureErrors.authorization({ reason: userType === 'gallery' ? 'not_gallery' : 'not_artist' });
        }

        // Ensure user type matches record type
        if (userType === 'gallery' && !artistCheck.is_gallery) {
          return SecureErrors.authorization({ reason: 'not_gallery' });
        }
      }
    } else {
      // For collectors, verify they exist in the Collectors table
      const { data: collectorCheck } = await supabase
        .from('Collectors')
        .select('user_id')
        .eq('user_id', userId)
        .single();
        
      if (!collectorCheck) {
        return SecureErrors.authorization({ reason: 'not_collector' });
      }
    }

    // Upload the validated file
    const uploadResult = await uploadProfilePicture(
      supabase, 
      userId, 
      secureValidation.sanitizedFile, 
      userType
    );

    // Update user profile with new picture URL
    if (userType === 'artist' || userType === 'gallery') {
      const { error: updateError } = await supabase
        .from('Artists')
        .update({ profilepix: uploadResult.url })
        .eq('id', userId);
        
      if (updateError) {
        secureLog('error', `Failed to update ${userType} profile picture URL`, {
          userId,
          error: updateError.message
        });
        return SecureErrors.database({ operation: `update_${userType}_profile` });
      }
    } else {
      const { error: updateError } = await supabase
        .from('Collectors')
        .update({ profilepix: uploadResult.url })
        .eq('user_id', userId);
        
      if (updateError) {
        secureLog('error', 'Failed to update collector profile picture URL', {
          userId,
          error: updateError.message
        });
        return SecureErrors.database({ operation: 'update_collector_profile' });
      }
    }

    secureLog('info', 'Profile picture upload completed successfully', {
      userId,
      userType,
      uploadPath: uploadResult.path,
      publicUrl: uploadResult.url
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      message: 'Profile picture uploaded successfully'
    });

  } catch (error) {
    secureLog('error', 'Profile picture upload failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return SecureErrors.server({ operation: 'profile_picture_upload' });
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