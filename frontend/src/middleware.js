import { NextResponse } from 'next/server';

/**
 * Next.js Edge Middleware for Reverse Proxy IP Preservation
 * Ensures that incoming client IP headers from NGINX / Cloudflare are preserved
 * and forwarded to downstream backend rewrites (http://127.0.0.1:5001/api/...).
 * This stops Next.js rewrites from masking client IP with 127.0.0.1.
 */
export function middleware(request) {
  const requestHeaders = new Headers(request.headers);

  // Extract real client IP from incoming proxy headers
  const incomingIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('true-client-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.ip;

  if (incomingIp && incomingIp !== '127.0.0.1' && incomingIp !== '::1') {
    requestHeaders.set('x-real-ip', incomingIp);
    requestHeaders.set('x-client-ip', incomingIp);
    requestHeaders.set('x-device-ip', incomingIp);
    
    // Ensure x-forwarded-for maintains the original client IP at the start
    const existingXff = request.headers.get('x-forwarded-for');
    if (!existingXff) {
      requestHeaders.set('x-forwarded-for', incomingIp);
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/api/:path*',
    '/socket.io/:path*',
    '/uploads/:path*'
  ],
};

