import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase-types'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')

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