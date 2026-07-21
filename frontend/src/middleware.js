import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Retrieve token and role from cookies
  const token = request.cookies.get('token')?.value || request.cookies.get('marketplace_token')?.value;
  const role = request.cookies.get('user_role')?.value;
  const SINGLE_MODE = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';

  // ── 1. Strict Tenant Routing & Redirects ──────────────────────────────────
  if (pathname === '/') {
    if (token) {
      if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
      if (role === 'merchant') return NextResponse.redirect(new URL('/merchant', request.url));
    }
    if (SINGLE_MODE) {
      return NextResponse.redirect(new URL('/customer', request.url));
    }
  }

  if (SINGLE_MODE) {
    // Admin/Merchants trying to visit customer landing should go to their panels
    if (token && pathname === '/customer') {
      if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
      if (role === 'merchant') return NextResponse.redirect(new URL('/merchant', request.url));
    }
    // Prevent customers/visitors from navigating to other marketplace restaurants
    if (pathname.startsWith('/customer/restaurant') && !pathname.includes('lassi-lounge') && !pathname.includes('/item/')) {
      return NextResponse.redirect(new URL('/customer', request.url));
    }
  } else {
    // In Marketplace Mode, block access to the single restaurant page
    if (pathname === '/customer') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 1. Logged-in user cannot visit /login — redirect to their dashboard
  if (pathname === '/login' && token) {
    if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
    if (role === 'merchant') return NextResponse.redirect(new URL('/merchant', request.url));
    return NextResponse.redirect(new URL('/customer', request.url));
  }

  // 3. Protect Admin routes
  if (pathname.startsWith('/admin')) {
    if (!token || role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 4. Protect Merchant routes
  if (pathname.startsWith('/merchant')) {
    if (!token || (role !== 'merchant' && role !== 'admin')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 5. Protect Customer authenticated routes
  if (
    pathname.startsWith('/customer/checkout') ||
    pathname.startsWith('/customer/orders') ||
    pathname.startsWith('/customer/profile')
  ) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 6. Prevent merchant/admin from accessing customer-only routes
  if (pathname.startsWith('/customer') && token) {
    if (role === 'merchant') {
      return NextResponse.redirect(new URL('/merchant', request.url));
    }
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/admin/:path*',
    '/merchant/:path*',
    '/customer/:path*',
  ],
};
