import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow these paths through — they have no auth requirement
  const isPublicPath =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-email');

  const token = request.cookies.get('nf_access_token')?.value;

  // Redirect authenticated users away from auth pages
  if (isPublicPath && pathname !== '/' && token) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  // Protect non-public routes — redirect unauthenticated to login
  // Unknown routes (not found, no match) will pass through and render the 404 page
  if (!isPublicPath && !token && pathname !== '/') {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icons, manifest
     * - Public assets
     * - API webhook routes (they handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|icon-|manifest|api/webhooks).*)',
  ],
};
