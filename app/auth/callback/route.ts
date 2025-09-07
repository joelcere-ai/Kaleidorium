import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase-types'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const token = requestUrl.searchParams.get('token')
  const type = requestUrl.searchParams.get('type')
  const accessToken = requestUrl.searchParams.get('access_token')
  const refreshToken = requestUrl.searchParams.get('refresh_token')

  console.log('Auth callback received:', {
    code: !!code,
    next,
    token: !!token,
    type,
    accessToken: !!accessToken,
    refreshToken: !!refreshToken,
    allParams: Object.fromEntries(requestUrl.searchParams.entries()),
    fullUrl: request.url
  });

  // Handle password reset flow - Supabase sends 'token' parameter for password reset
  if (type === 'recovery' && token) {
    console.log('Password reset detected with token, processing...');
    
    try {
      // Exchange the token for session tokens
      const supabase = createRouteHandlerClient<Database>({ cookies })
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery'
      });

      if (error) {
        console.error('Error verifying recovery token:', error);
        return NextResponse.redirect(`${requestUrl.origin}/forgot-password?error=invalid_token`);
      }

      if (data.session) {
        console.log('Recovery session created successfully');
        // Redirect to password reset page - the session will be automatically available
        return NextResponse.redirect(`${requestUrl.origin}/password-reset`);
      } else {
        console.log('No session created from recovery token');
        return NextResponse.redirect(`${requestUrl.origin}/forgot-password?error=no_session`);
      }
    } catch (err) {
      console.error('Unexpected error during token verification:', err);
      return NextResponse.redirect(`${requestUrl.origin}/forgot-password?error=unexpected`);
    }
  }

  // Handle regular auth code exchange
  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

    if (next) {
      return NextResponse.redirect(requestUrl.origin + next);
    }

    if (session?.user.aud === 'authenticated') {
      // For regular sign-in, redirect to homepage
      return NextResponse.redirect(requestUrl.origin);
    }
  }

  // Fallback redirect
  return NextResponse.redirect(requestUrl.origin);
} 