// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Pages anyone can visit without signing in
const PUBLIC_PATHS = [
  '/',
  '/auth',
  '/explore',
  '/trending',
  '/discover',
];

// Prefixes that should always be public
const PUBLIC_PREFIXES = [
  '/profile',    // public profiles (each page handles privacy)
  '/api/cron',   // Vercel cron jobs
  '/api/contact',// Contact form
  '/_next',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public paths and prefixes
  const isPublicPath = PUBLIC_PATHS.some(
    path => pathname === path || pathname.startsWith(path + '/')
  );
  const isPublicPrefix = PUBLIC_PREFIXES.some(
    prefix => pathname.startsWith(prefix)
  );
  const isStatic =
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/og-image') ||
    pathname.startsWith('/reading-bg') ||
    pathname.startsWith('/icon-') ||
    pathname === '/manifest.json' ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico');

  if (isPublicPath || isPublicPrefix || isStatic) {
    return NextResponse.next();
  }

  // 2. Create Supabase client with cookie handling
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 3. If not authenticated, redirect to /auth
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};