import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const STATIC_EXT = /\.(json|ico|png|jpg|jpeg|gif|svg|webp|avif)$/i;

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and Next.js internals
  if (STATIC_EXT.test(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('nf_access_token')?.value;

  const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/reset-password' || pathname === '/verify-email';

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  if (pathname !== '/' && !isAuthRoute && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image).*)'],
};
