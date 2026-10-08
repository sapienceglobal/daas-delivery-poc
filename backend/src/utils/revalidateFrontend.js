/**
 * Triggers Next.js on-demand ISR revalidation on the frontend server.
 * Uses FRONTEND_URL strictly from environment variables without hardcoded localhost.
 */
export async function triggerFrontendRevalidation(paths) {
  const frontendUrl = process.env.FRONTEND_URL;
  const secret = process.env.REVALIDATION_SECRET_TOKEN;

  if (!frontendUrl) {
    console.warn('[Revalidation] FRONTEND_URL environment variable is not configured. Skipping revalidation.');
    return;
  }

  if (!secret) {
    console.warn('[Revalidation] REVALIDATION_SECRET_TOKEN environment variable is not configured. Skipping revalidation.');
    return;
  }

  const pathList = Array.isArray(paths) ? paths : [paths].filter(Boolean);
  if (pathList.length === 0) return;

  try {
    const endpoint = `${frontendUrl.replace(/\/$/, '')}/api/revalidate`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret,
        paths: pathList,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[Revalidation] Frontend returned HTTP ${res.status}: ${errText}`);
    } else {
      console.log(`[Revalidation] Successfully triggered revalidation on ${frontendUrl} for:`, pathList);
    }
  } catch (err) {
    console.warn(`[Revalidation] Could not connect to frontend at ${frontendUrl}: ${err.message}`);
  }
}
