import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Paths that never require authentication (browser + API). */
const publicPaths = ['/login', '/signup', '/auth/callback', '/portal-login']

/**
 * API routes that authenticate themselves via `x-api-key` header instead of
 * Supabase session cookies. Anything outside this list under /api/* requires
 * a valid Supabase session.
 */
const apiKeyAuthedPrefixes = ['/api/v1/ingest']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Always allow public paths ──
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next({ request })
  }

  // ── 2. API routes that use x-api-key auth (handler enforces the check) ──
  if (apiKeyAuthedPrefixes.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ── 3. Create Supabase client (handles cookie refresh) ──
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── 4. Authenticated API routes: return 401 JSON instead of redirect HTML ──
  if (pathname.startsWith('/api/')) {
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return supabaseResponse
  }

  // ── 5. Portal routes: require auth, redirect to portal-login ──
  if (pathname.startsWith('/portal')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/portal-login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // ── 6. All other routes: require auth, redirect to /login ──
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
