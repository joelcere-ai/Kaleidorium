import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase-types'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const type = requestUrl.searchParams.get('type')

  // Debug logging
  console.log('Auth callback params:', {
    url: requestUrl.toString(),
    code: !!code,
    next,
    type,
    allParams: Object.fromEntries(requestUrl.searchParams.entries())
  });

  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    console.log('Session exchange result:', {
      hasSession: !!session,
      userAud: session?.user?.aud,
      error: error?.message
    });

    if (session?.user.aud === 'authenticated') {
      // Multiple ways to detect password recovery:
      
      // 1. Check 'type' parameter
      if (type === 'recovery') {
        console.log('Password recovery detected via type parameter');
        return NextResponse.redirect(`${requestUrl.origin}/auth/password-reset`);
      }
      
      // 2. Check if URL contains recovery-related terms
      const urlString = requestUrl.toString().toLowerCase();
      if (urlString.includes('type=recovery') || urlString.includes('recovery') || urlString.includes('reset')) {
        console.log('Recovery detected in URL string');
        return NextResponse.redirect(`${requestUrl.origin}/auth/password-reset`);
      }
      
      // 3. Check if this came from a password reset email by examining the session
      // Password reset sessions have specific characteristics
      const user = session.user;
      if (user?.email_confirmed_at && user?.last_sign_in_at) {
        const emailConfirmed = new Date(user.email_confirmed_at);
        const lastSignIn = new Date(user.last_sign_in_at);
        // If email was confirmed very recently (within 5 minutes), it's likely a password reset
        const timeDiff = Math.abs(lastSignIn.getTime() - emailConfirmed.getTime());
        if (timeDiff < 5 * 60 * 1000) { // 5 minutes in milliseconds
          console.log('Password recovery detected via session timing');
          return NextResponse.redirect(`${requestUrl.origin}/auth/password-reset`);
        }
      }

      // 4. If 'next' parameter exists, use it
      if (next) {
        console.log('Redirecting to next:', requestUrl.origin + next);
        return NextResponse.redirect(requestUrl.origin + next);
      }
      
      // 5. Check redirect_to parameter (Supabase sometimes uses this)
      const redirectTo = requestUrl.searchParams.get('redirect_to');
      if (redirectTo && redirectTo.includes('/auth/password-reset')) {
        console.log('Password reset detected via redirect_to parameter');
        return NextResponse.redirect(`${requestUrl.origin}/auth/password-reset`);
      }
      
      console.log('Regular sign-in, redirecting to homepage');
      // For regular sign-in, redirect to homepage
      return NextResponse.redirect(requestUrl.origin);
    }
  }

  console.log('Fallback redirect to homepage');
  // Fallback redirect
  return NextResponse.redirect(requestUrl.origin);
} 