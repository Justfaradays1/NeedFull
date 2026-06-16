import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// WHAT: Protect /(main) routes and redirect away from /(auth) if logged in
// WHY: Prevent unauthenticated users from accessing protected pages
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Custom JWT token is stored in cookie 'nf_access_token' via authStore.ts
  const token = request.cookies.get('nf_access_token')?.value;

  const isAuthRoute = pathname.startsWith('/auth') || pathname === '/login' || pathname === '/register';
  const isProtectedRoute = !isAuthRoute && pathname !== '/' && !pathname.startsWith('/_next') && !pathname.startsWith('/api');

  // Redirect to dashboard if logged in and trying to access auth pages
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  // Redirect to login if not logged in and trying to access protected pages
  if (isProtectedRoute && !token) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
