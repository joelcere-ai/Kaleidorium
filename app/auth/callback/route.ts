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

  console.log('=== AUTH CALLBACK STARTED ===');
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
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));

  // For debugging - return a simple response to see if callback is working
  if (process.env.NODE_ENV === 'development') {
    console.log('=== DEVELOPMENT MODE - RETURNING DEBUG RESPONSE ===');
    return new NextResponse(`
      <html>
        <body>
          <h1>Auth Callback Debug</h1>
          <p>Type: ${type}</p>
          <p>Token: ${token ? 'Present' : 'Missing'}</p>
          <p>Code: ${code ? 'Present' : 'Missing'}</p>
          <p>Full URL: ${request.url}</p>
          <p>All Params: ${JSON.stringify(Object.fromEntries(requestUrl.searchParams.entries()))}</p>
          <script>
            setTimeout(() => {
              window.location.href = '/password-reset';
            }, 3000);
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  // Handle password reset flow - Supabase sends 'token' parameter for password reset
  if (type === 'recovery' && token) {
    console.log('Password reset detected with token, processing...');
    
    try {
      const supabase = createRouteHandlerClient<Database>({ cookies })
      
      // Try different approaches for password reset token verification
      let session = null;
      let error = null;
      
      // Method 1: Try verifyOtp with token_hash
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery'
      });
      
      if (verifyData.session) {
        session = verifyData.session;
        console.log('Recovery session created via verifyOtp for user:', session.user?.email);
      } else {
        console.log('verifyOtp failed, trying alternative method...');
        
        // Method 2: Try using the token directly as a code
        const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(token);
        
        if (exchangeData.session) {
          session = exchangeData.session;
          console.log('Recovery session created via exchangeCodeForSession for user:', session.user?.email);
        } else {
          error = exchangeError || verifyError;
        }
      }

      if (error) {
        console.error('=== ERROR VERIFYING RECOVERY TOKEN ===');
        console.error('Error details:', error);
        console.error('Token value:', token.substring(0, 10) + '...');
        console.error('Full token:', token);
        return NextResponse.redirect(`${requestUrl.origin}/forgot-password?error=invalid_token`);
      }

      if (session) {
        console.log('=== RECOVERY SESSION CREATED SUCCESSFULLY ===');
        console.log('User email:', session.user?.email);
        console.log('Session expires at:', session.expires_at);
        console.log('Redirecting to password reset page...');
        // Redirect to password reset page with the session
        return NextResponse.redirect(`${requestUrl.origin}/password-reset`);
      } else {
        console.log('=== NO SESSION CREATED ===');
        console.log('verifyData:', verifyData);
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
  console.log('=== FALLBACK REDIRECT ===');
  console.log('No matching conditions found, redirecting to home');
  return NextResponse.redirect(requestUrl.origin);
} 