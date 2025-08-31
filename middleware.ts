import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { generalRateLimit, authRateLimit, registrationRateLimit } from '@/lib/rate-limit'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // SECURITY: Apply global rate limiting based on route patterns
  const pathname = req.nextUrl.pathname;
  
  // Apply specific rate limits based on the route
  if (pathname.includes('/api/')) {
    // API routes get rate limiting
    if (pathname.includes('/auth/') || pathname.includes('/login') || pathname.includes('/verify-invite')) {
      // Authentication endpoints - strict limits
      const rateLimitResponse = authRateLimit(req);
      if (rateLimitResponse) return rateLimitResponse;
    } else if (pathname.includes('/register') || pathname.includes('/artist-submission') || pathname.includes('/submit-portfolio')) {
      // Registration endpoints - moderate limits
      const rateLimitResponse = registrationRateLimit(req);
      if (rateLimitResponse) return rateLimitResponse;
    } else {
      // General API endpoints - lenient limits
      const rateLimitResponse = generalRateLimit(req);
      if (rateLimitResponse) return rateLimitResponse;
    }
  }

  const supabase = createMiddlewareClient({ req, res })

  // Get session
  const { data: { session } } = await supabase.auth.getSession()

  // Note: Admin route protection is now handled directly in the /admin page component
  // This middleware is now mainly for other future route protections

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Include API routes for rate limiting
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 