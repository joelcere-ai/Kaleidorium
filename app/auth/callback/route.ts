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
      // Check if this is a password recovery flow
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.is_recovery) {
          // It's a recovery, so clear the flag and redirect to update password
           await supabase.auth.updateUser({
               data: { is_recovery: undefined } 
           });
          return NextResponse.redirect(`${requestUrl.origin}/update-password`);
      }
      return NextResponse.redirect(requestUrl.origin);
    }
  }

  // Fallback redirect
  return NextResponse.redirect(requestUrl.origin);
} 