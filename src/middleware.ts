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
        if (payload.role === 'PIC_PROVINSI') return NextResponse.redirect(new URL('/pic-provinsi/dashboard', request.url));
        if (payload.role === 'PIC_KABKOTA') return NextResponse.redirect(new URL('/pic-kabkota/dashboard', request.url));
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
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect PIC Provinsi routes
  if (pathname.startsWith('/pic-provinsi')) {
    if (!sessionCookie) return NextResponse.redirect(new URL('/login', request.url));
    try {
      const payload = await decrypt(sessionCookie);
      if (payload.role !== 'PIC_PROVINSI') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect PIC KabKota routes
  if (pathname.startsWith('/pic-kabkota')) {
    if (!sessionCookie) return NextResponse.redirect(new URL('/login', request.url));
    try {
      const payload = await decrypt(sessionCookie);
      if (payload.role !== 'PIC_KABKOTA') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  const response = NextResponse.next();
  
  // Prevent caching for protected routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/stages') || pathname.startsWith('/dashboard') || pathname.startsWith('/pic-provinsi') || pathname.startsWith('/pic-kabkota')) {
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  matcher: ['/', '/login', '/admin/login', '/admin/:path*', '/stages/:path*', '/dashboard/:path*', '/pic-provinsi/:path*', '/pic-kabkota/:path*'],
};
