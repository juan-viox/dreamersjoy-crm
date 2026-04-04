import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Paths that never require authentication */
const publicPaths = ['/login', '/signup', '/auth/callback', '/portal-login']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Always allow public paths ──
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next({ request })
  }

  // ── 2. Always allow ingest API routes (API-key auth in route handlers) ──
  if (pathname.startsWith('/api/v1/ingest')) {
    return NextResponse.next()
  }

  // ── 3. Always allow public API routes ──
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // ── 4. Create Supabase client that handles cookie refresh ──
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

  // ── 5. Portal routes: require auth, redirect to portal-login ──
  if (pathname.startsWith('/portal')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/portal-login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // ── 6. All other routes: require auth ──
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
