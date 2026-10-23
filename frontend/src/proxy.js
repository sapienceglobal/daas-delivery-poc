import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ── JWT Verification (Edge Runtime compatible) ───────────────────────────────
// we verify the actual JWT token signature so route guards CANNOT be bypassed
// by editing cookies in DevTools. The role is from the signed JWT payload only.
//
// CRITICAL: JWT_SECRET must be set in frontend .env.local to MATCH the backend.
// without it, every token verification fails and users get infinite login loops.

async function getVerifiedRole(token) {
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // if JWT_SECRET is not configured, we cannot verify any token.
    // this will cause all protected routes to redirect to /login.
    // to fix: add JWT_SECRET=<same-as-backend> to frontend/.env.local
    console.error('[PROXY] JWT_SECRET is not set in frontend env. Token verification will fail.');
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    // payload.role is embedded in new tokens (after security update).
    // old tokens won't have role — default to 'customer' since:
    // 1. JWT signature IS verified (tampered tokens return null below)
    // 2. Backend protect() always re-checks the real role from DB
    return payload?.role || 'customer';
  } catch {
    // token is invalid, expired, or tampered — treat as unauthenticated
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

  // ── 1. Single Restaurant Mode routing ────────────────────────────────────
  if (SINGLE_MODE) {
    if (pathname.startsWith('/restaurant') && pathname !== '/restaurant-panel' && !pathname.includes('lassi-lounge') && !pathname.includes('/item/')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // ── 2. Restaurant Partner Portal (/restaurant-panel) ──────────────────────
  // If merchant or admin is already logged in, automatically send them to their dashboard
  if (pathname === '/restaurant-panel' && token && role) {
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
  }

  // ── 3. Customer Login (/login) ────────────────────────────────────────────
  // Redirect already-logged-in merchant/admin to their dashboard so they don't get stuck
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
    // customers: handled by login page useEffect with ?redirect=
  }

  // ── 4. Protect /admin routes ──────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!token || role !== 'admin') {
      const loginUrl = new URL('/restaurant-panel', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── 5. Protect /merchant routes ───────────────────────────────────────────
  if (pathname.startsWith('/merchant')) {
    if (!token || (role !== 'merchant' && role !== 'admin')) {
      const loginUrl = new URL('/restaurant-panel', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── 6. Protect sensitive customer sub-routes ──────────────────────────────
  // Note: /checkout supports guest checkout and does not require pre-login.
  // /profile requires an authenticated session.
  // /orders requires an authenticated session (or tracking token for /orders/:id).
  if (pathname.startsWith('/profile')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname === '/orders' || pathname === '/orders/') {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith('/orders/')) {
    const hasTrackingToken = request.nextUrl.searchParams.has('token');
    if (!token && !hasTrackingToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // NOTE: Root ('/') and all public storefront pages (/menu, /about-us, /order-online, etc.)
  // are never blocked, allowing merchants/admins to seamlessly browse the customer website!

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/restaurant-panel',
    '/admin/:path*',
    '/merchant/:path*',
    '/orders/:path*',
    '/profile/:path*',
    '/restaurant/:path*',
  ],
};
