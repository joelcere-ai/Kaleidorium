import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase-types'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  console.log('Password reset callback:', {
    url: requestUrl.toString(),
    code: !!code,
    allParams: Object.fromEntries(requestUrl.searchParams.entries())
  });

  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    console.log('Password reset session exchange:', {
      hasSession: !!session,
      error: error?.message
    });

    if (session?.user.aud === 'authenticated') {
      console.log('Redirecting to password reset form');
      return NextResponse.redirect(`${requestUrl.origin}/auth/password-reset`);
    }
  }

  console.log('Password reset callback failed, redirecting to login');
  return NextResponse.redirect(`${requestUrl.origin}/login`);
} 