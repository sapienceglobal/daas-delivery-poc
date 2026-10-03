'use client';

import { useEffect } from 'react';

/**
 * Last-resort boundary: only renders if the ROOT layout itself crashes, so it
 * must render its own <html>/<body> and cannot rely on providers, header,
 * footer or Tailwind tokens. Inline styles keep the same brand look.
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[Global Error]', error);
  }, [error]);

  const maroon = '#7a0b10';

  return (
    <html lang="en">
      <head>
        <title>Something Went Wrong | Lassi Lounge NY</title>
        <meta name="robots" content="noindex" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:ital,wght@0,700;0,900;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 85% 10%, rgba(122,11,16,0.10), transparent 45%), radial-gradient(circle at 10% 90%, rgba(245,184,74,0.18), transparent 45%), #faf9f8',
          fontFamily: "'Inter', system-ui, sans-serif",
          color: '#1a1a1a',
          padding: '24px',
          boxSizing: 'border-box',
        }}
      >
        <main style={{ maxWidth: 560, textAlign: 'center' }}>
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontSize: 'clamp(80px, 18vw, 128px)', lineHeight: 1, margin: 0, color: maroon }}>
            500
          </p>
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', color: maroon, fontSize: 20, margin: '12px 0 0' }}>
            Something spilled in the kitchen
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 5vw, 44px)', margin: '10px 0 0' }}>
            Something Went Wrong
          </h1>
          <p style={{ color: '#4b5563', fontSize: 17, lineHeight: 1.6, margin: '18px 0 0' }}>
            We hit an unexpected problem. Please try again — if it keeps happening, give us a call and we'll take your order directly.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32 }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{ background: maroon, color: '#fff', border: 0, borderRadius: 999, padding: '14px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 10px 24px rgba(122,11,16,0.25)' }}
            >
              Try Again
            </button>
            {/* plain <a> on purpose — full reload recovers a broken root layout */}
            <a
              href="/"
              style={{ background: '#fff', color: maroon, border: `2px solid ${maroon}`, borderRadius: 999, padding: '12px 28px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
            >
              Back to Home
            </a>
          </div>
          {error?.digest && (
            <p style={{ color: '#9ca3af', fontSize: 11, marginTop: 36 }}>
              Reference ID: <span style={{ fontFamily: 'monospace' }}>{error.digest}</span>
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
