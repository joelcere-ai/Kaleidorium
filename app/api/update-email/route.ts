import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { validateEmail, validateUUID } from '@/lib/validation'
import { generalRateLimit } from '@/lib/rate-limit'
import { handleSupabaseError, SecureErrors, secureLog } from '@/lib/secure-error-handler'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: Request) {
  // SECURITY: Apply rate limiting for email updates
  const rateLimitResponse = generalRateLimit(request as any);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  let sanitizedEmail: string
  let sanitizedUserId: string

  try {
    const { newEmail, userId } = await request.json()
    
    // Validate required fields
    if (!newEmail || !userId) {
      return SecureErrors.validation('New email and user ID are required');
    }

    // Validate email format
    const emailValidation = validateEmail(newEmail)
    if (!emailValidation.valid) {
      return SecureErrors.validation(emailValidation.error || 'Invalid email format');
    }

    // Validate user ID format
    const userIdValidation = validateUUID(userId)
    if (!userIdValidation.valid) {
      return SecureErrors.validation('Invalid user ID format');
    }

    sanitizedEmail = emailValidation.sanitized!
    sanitizedUserId = userIdValidation.sanitized!
  } catch (error) {
    return SecureErrors.validation('Invalid request format');
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    secureLog('info', 'Email update request', { 
      userId: sanitizedUserId 
    });

    // Update Collectors table
    const { error: updateError } = await supabase
      .from('Collectors')
      .update({ email: sanitizedEmail })
      .eq('user_id', sanitizedUserId)

    if (updateError) {
      return handleSupabaseError(updateError, 'collector_email_update');
    }

    secureLog('info', 'Collector email updated successfully', { userId: sanitizedUserId });

    // Try updating Artists table if user is an artist
    try {
      await supabase
        .from('Artists')
        .update({ email: sanitizedEmail })
        .eq('id', sanitizedUserId)
      secureLog('info', 'Artist email updated successfully', { userId: sanitizedUserId });
    } catch (artistError) {
      // Silent fail - user may not be an artist
      secureLog('info', 'User is not an artist, skipping artist table update', { userId: sanitizedUserId });
    }

    return NextResponse.json({ success: true, message: 'Email updated successfully' })
  } catch (error: any) {
    return SecureErrors.server({ operation: 'email_update' });
  }
} 