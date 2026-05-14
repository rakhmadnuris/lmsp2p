import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/auth';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  // Protect Admin routes
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!sessionCookie) return NextResponse.redirect(new URL('/admin/login', request.url));
    try {
      const payload = await decrypt(sessionCookie);
      if (payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Redirect logged-in users away from login pages
  if (pathname === '/' || pathname === '/login' || pathname === '/admin/login') {
    if (sessionCookie) {
      try {
        const payload = await decrypt(sessionCookie);
        if (payload.role === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        if (payload.role === 'PARTICIPANT') return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch (e) {
        // invalid session, just let them see the login page
      }
    }
  }

  // Protect Participant routes
  if (pathname.startsWith('/stages') || pathname.startsWith('/dashboard')) {
    if (!sessionCookie) return NextResponse.redirect(new URL('/login', request.url));
    try {
      const payload = await decrypt(sessionCookie);
      if (payload.role !== 'PARTICIPANT') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  const response = NextResponse.next();
  
  // Prevent caching for protected routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/stages') || pathname.startsWith('/dashboard')) {
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  matcher: ['/', '/login', '/admin/login', '/admin/:path*', '/stages/:path*', '/dashboard/:path*'],
};
