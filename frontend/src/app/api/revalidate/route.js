import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Timing-safe string comparison to protect against timing attacks.
 */
function isTimingSafeMatch(received, expected) {
  if (typeof received !== 'string' || typeof expected !== 'string') {
    return false;
  }
  const bufReceived = Buffer.from(received);
  const bufExpected = Buffer.from(expected);

  if (bufReceived.length !== bufExpected.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufReceived, bufExpected);
}

/**
 * Secured on-demand ISR revalidation endpoint.
 * STRICT SECURITY:
 * - Only POST allowed (GET is rejected with 405).
 * - Requires exact REVALIDATION_SECRET_TOKEN.
 * - Uses crypto.timingSafeEqual to prevent side-channel timing attacks.
 */
export async function POST(request) {
  try {
    const url = new URL(request.url);
    const querySecret = url.searchParams.get('secret');

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Body may be empty if params were passed via query string
    }

    const providedSecret = querySecret || body.secret;
    const expectedSecret = process.env.REVALIDATION_SECRET_TOKEN;

    if (!providedSecret || !expectedSecret || !isTimingSafeMatch(providedSecret, expectedSecret)) {
      return NextResponse.json(
        { message: 'Unauthorized: Invalid or missing revalidation token' },
        { status: 401 }
      );
    }

    // Support single path or array of paths
    const rawPaths = body.paths || body.path || url.searchParams.get('path');
    const pathsToRevalidate = Array.isArray(rawPaths)
      ? rawPaths
      : rawPaths
      ? [rawPaths]
      : [];

    if (pathsToRevalidate.length === 0) {
      return NextResponse.json(
        { message: 'Bad Request: Missing "path" or "paths" to revalidate' },
        { status: 400 }
      );
    }

    const revalidated = [];
    for (const targetPath of pathsToRevalidate) {
      if (typeof targetPath === 'string' && targetPath.trim()) {
        const cleanPath = targetPath.trim();
        try {
          revalidatePath(cleanPath, 'page');
          revalidatePath(cleanPath);
          if (cleanPath.startsWith('/item/')) {
            revalidatePath('/item/[itemId]', 'page');
          }
        } catch (e) {
          // continue
        }
        revalidated.push(cleanPath);
      }
    }

    return NextResponse.json({
      revalidated: true,
      paths: revalidated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { message: 'Internal Server Error during revalidation', error: err.message },
      { status: 500 }
    );
  }
}

/**
 * Reject GET requests explicitly with 405 Method Not Allowed.
 */
export async function GET() {
  return NextResponse.json(
    { message: 'Method Not Allowed. Use POST with authorization secret.' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
