import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// WHAT: Decode JWT payload without verifying signature
// WHY: Middleware runs in Edge Runtime, can't access bcrypt/jwt library easily
//      We only need the role claim, which is in the unencrypted base64 payload
function decodeTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch {
    return null;
  }
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow these paths through — they have no auth requirement
  const isPublicPath =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/auth/google') ||
    pathname.startsWith('/api/auth/google') ||
    pathname.startsWith('/google/success') ||
    pathname.startsWith('/auth/complete-registration') ||
    pathname === '/terms' ||
    pathname === '/privacy' ||
    pathname.startsWith('/faq') ||
    pathname.startsWith('/help') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/support') ||
    pathname.startsWith('/guides') ||
    pathname === '/about';

  const token = request.cookies.get('nf_access_token')?.value;

  // ---- OAuth routes (never redirect — must always process) ----------
  const isOAuthPath =
    pathname.startsWith('/api/auth/google') ||
    pathname.startsWith('/google/success');

  // ---- AUTHENTICATED USER HANDLING ---------------------------------
  if (token) {
    // Decode JWT to extract role for admin routing
    const payload = decodeTokenPayload(token);
    const role = payload?.role as string | undefined;
    const isAdmin = role === 'admin';

    // Redirect authenticated users away from auth pages (except OAuth routes)
    if (isPublicPath && pathname !== '/' && !isOAuthPath) {
      if (isAdmin) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.redirect(new URL('/feed', request.url));
    }

    // Admin routes — verify admin role
    if (pathname.startsWith('/admin')) {
      if (!isAdmin) {
        // Non-admin trying to access /admin — send to feed
        return NextResponse.redirect(new URL('/feed', request.url));
      }
      // Admin confirmed — allow through
      return NextResponse.next();
    }

    // Root path — redirect based on role
    if (pathname === '/') {
      if (isAdmin) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.redirect(new URL('/feed', request.url));
    }

    // All other authenticated routes — allow through
    return NextResponse.next();
  }

  // ---- UNAUTHENTICATED USER HANDLING -------------------------------
  // Protect non-public routes — redirect unauthenticated to login
  if (!isPublicPath && pathname !== '/') {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Public/root paths for unauthenticated users — allow through
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
