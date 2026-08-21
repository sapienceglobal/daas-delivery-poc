import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ── JWT Verification (Edge Runtime compatible) ───────────────────────────────
// We verify the actual JWT token signature so route guards CANNOT be bypassed
// by editing cookies in DevTools. The role is from the signed JWT payload only.
//
// CRITICAL: JWT_SECRET must be set in frontend .env.local to MATCH the backend.
// Without it, every token verification fails and users get infinite login loops.

async function getVerifiedRole(token) {
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // If JWT_SECRET is not configured, we cannot verify any token.
    // This will cause all protected routes to redirect to /login.
    // To fix: add JWT_SECRET=<same-as-backend> to frontend/.env.local
    console.error('[PROXY] JWT_SECRET is not set in frontend env. Token verification will fail.');
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    // payload.role is embedded in new tokens (after security update).
    // Old tokens won't have role — default to 'customer' since:
    // 1. JWT signature IS verified (tampered tokens return null below)
    // 2. Backend protect() always re-checks the real role from DB
    return payload?.role || 'customer';
  } catch {
    // Token is invalid, expired, or tampered — treat as unauthenticated
    return null;
  }
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const SINGLE_MODE = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';

  // ── Token from httpOnly cookie (set by backend, NOT readable by JS) ────────
  const token = request.cookies.get('token')?.value || request.cookies.get('marketplace_token')?.value;

  // ── Role from cryptographically verified JWT — NOT from user_role cookie ───
  const role = await getVerifiedRole(token);

  // ── 1. Root path routing ───────────────────────────────────────────────────
  if (pathname === '/') {
    if (token && role) {
      if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
      if (role === 'merchant') return NextResponse.redirect(new URL('/merchant', request.url));
    }
  }

  // ── 2. Single Restaurant Mode routing ────────────────────────────────────
  if (SINGLE_MODE) {
    if (pathname.startsWith('/restaurant') && pathname !== '/restaurant-panel' && !pathname.includes('lassi-lounge') && !pathname.includes('/item/')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // ── 3. Redirect already-logged-in admin/merchant away from /login ─────────
  // Customers stay on /login so the page's useEffect can handle ?redirect= param.
  if (pathname === '/login' && token && role) {
    if (role === 'admin') {
      const redirectTo = request.nextUrl.searchParams.get('redirect');
      const dest = (redirectTo && redirectTo.startsWith('/admin')) ? redirectTo : '/admin';
      return NextResponse.redirect(new URL(dest, request.url));
    }
    if (role === 'merchant') {
      const redirectTo = request.nextUrl.searchParams.get('redirect');
      const dest = (redirectTo && redirectTo.startsWith('/merchant')) ? redirectTo : '/merchant';
      return NextResponse.redirect(new URL(dest, request.url));
    }
    // Customers: let the login page handle ?redirect= via its own useEffect
  }

  if (pathname === '/restaurant-panel' && token && role) {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (role === 'merchant') {
      return NextResponse.redirect(new URL('/merchant', request.url));
    }
  }

  // ── 4. Protect /admin routes ──────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!token || role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // ── 5. Protect /merchant routes ───────────────────────────────────────────
  if (pathname.startsWith('/merchant')) {
    if (!token || (role !== 'merchant' && role !== 'admin')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // ── 6. Protect sensitive customer sub-routes ──────────────────────────────
  if (
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/profile')
  ) {
    if (!token || !role) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── 7. Prevent merchant/admin from accessing customer-only routes ─────────
  if (
    (pathname === '/' || pathname.startsWith('/checkout') || pathname.startsWith('/orders') || pathname.startsWith('/profile') || pathname.startsWith('/restaurant') || pathname.startsWith('/offers') || pathname.startsWith('/loyalty'))
    && token && role
  ) {
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
    '/restaurant-panel',
    '/admin/:path*',
    '/merchant/:path*',
    '/checkout/:path*',
    '/orders/:path*',
    '/profile/:path*',
    '/restaurant/:path*',
    '/loyalty/:path*',
    '/offers/:path*',
    '/about-us/:path*',
    '/contact-us/:path*'
  ],
};
