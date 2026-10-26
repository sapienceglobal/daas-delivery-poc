/**
 * Client-Side Geolocation & Telemetry Helper
 * Requests and caches client location gracefully for delivery address estimation,
 * accurate delivery radius calculations, and forensic audit logging.
 */

export async function initClientGeolocation(promptIfNeeded = false) {
  if (typeof window === 'undefined' || !navigator.geolocation) return;

  try {
    // Check permission state without triggering prompt if promptIfNeeded is false
    if (navigator.permissions && navigator.permissions.query) {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      if (status.state === 'granted') {
        fetchAndStoreLocation();
      } else if (status.state === 'prompt' && promptIfNeeded) {
        fetchAndStoreLocation();
      }
      status.onchange = () => {
        if (status.state === 'granted') fetchAndStoreLocation();
      };
      return;
    }

    if (promptIfNeeded) {
      fetchAndStoreLocation();
    }
  } catch (err) {
    if (promptIfNeeded) {
      fetchAndStoreLocation();
    }
  }
}

export function saveClientLocation({ lat, lng, city = '', region = '', country = '', display = '' }) {
  if (typeof window === 'undefined') return;
  try {
    const locDisplay = display || [city, region, country].filter(Boolean).join(', ') || (lat && lng ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : '');
    localStorage.setItem('user_geo_location', JSON.stringify({
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      city,
      region,
      country,
      display: locDisplay
    }));
  } catch (e) {}
}

function fetchAndStoreLocation() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      try {
        // Reverse geocode via backend API
        const res = await fetch(`/api/location/reverse-geocode?lat=${lat}&lng=${lng}`);
        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || '';
          const region = addr.state || addr.region || '';
          const country = addr.country || '';
          const display = data.displayName || data.display_name || [city, region, country].filter(Boolean).join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

          saveClientLocation({
            lat,
            lng,
            city,
            region,
            country,
            display
          });
          return;
        }
      } catch (e) {
        // Fallback to storing lat/lng
      }

      saveClientLocation({
        lat,
        lng,
        display: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      });
    },
    (err) => {
      // Permission denied or unavailable - silent fail
    },
    { timeout: 8000, maximumAge: 300000, enableHighAccuracy: false }
  );
}

