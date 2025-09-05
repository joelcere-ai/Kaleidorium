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

    if (next) {
      console.log('Redirecting to next:', requestUrl.origin + next);
      return NextResponse.redirect(requestUrl.origin + next);
    }

    if (session?.user.aud === 'authenticated') {
      // Check if this is a password recovery flow by checking the 'type' parameter
      // Supabase sends type=recovery for password reset flows
      if (type === 'recovery') {
        console.log('Password recovery detected, redirecting to password reset');
        return NextResponse.redirect(`${requestUrl.origin}/auth/password-reset`);
      }
      
      // Also check if the URL contains recovery-related terms as fallback
      const urlString = requestUrl.toString().toLowerCase();
      if (urlString.includes('recovery') || urlString.includes('reset')) {
        console.log('Recovery detected in URL, redirecting to password reset');
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