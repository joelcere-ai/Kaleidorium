import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase-types'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const accessToken = requestUrl.searchParams.get('access_token')
  const refreshToken = requestUrl.searchParams.get('refresh_token')
  const type = requestUrl.searchParams.get('type')

  console.log('Auth callback received:', {
    code: !!code,
    next,
    accessToken: !!accessToken,
    refreshToken: !!refreshToken,
    type,
    fullUrl: request.url
  });

  // Handle password reset flow
  if (type === 'recovery' && accessToken && refreshToken) {
    console.log('Password reset detected, redirecting to password-reset page');
    // Redirect to password reset page with tokens in URL fragment
    const resetUrl = `${requestUrl.origin}/password-reset#access_token=${accessToken}&refresh_token=${refreshToken}&type=recovery`;
    return NextResponse.redirect(resetUrl);
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