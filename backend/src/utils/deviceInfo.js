import { ipKeyGenerator } from 'express-rate-limit';

/**
 * Checks if an IP is loopback or local private address (RFC 1918 / RFC 4193 / Loopback)
 */
export function isPrivateOrLoopbackIp(ip) {
  if (!ip || typeof ip !== 'string') return true;
  const clean = ip.replace(/^::ffff:/, '').trim().toLowerCase();
  if (['127.0.0.1', '::1', 'localhost'].includes(clean)) return true;
  // Private IPv4 ranges:
  // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16 (link-local)
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.)/.test(clean)) return true;
  // Private IPv6 ranges: fc00::/7 (unique local), fe80::/10 (link-local)
  if (/^(fc|fd|fe80)/i.test(clean)) return true;
  return false;
}

/**
 * Robust Client IP Resolution across NGINX, Cloudflare, Next.js rewrites, AWS CloudFront, and Mobile Apps.
 * Correctly handles multi-hop reverse proxies (e.g. Client -> NGINX -> Next.js -> Express)
 * by finding the outermost non-private public IP address.
 */
export function getClientIp(req) {
  if (!req) return '127.0.0.1';
  const headers = req.headers || {};

  const rawCandidates = [
    headers['cf-connecting-ip'],
    headers['true-client-ip'],
    headers['x-real-ip'],
    headers['x-client-ip'],
    headers['x-device-ip'],
  ];

  // X-Forwarded-For can contain comma-separated list of hops: "client, proxy1, proxy2"
  if (headers['x-forwarded-for']) {
    const parts = headers['x-forwarded-for'].split(',').map(s => s.trim());
    rawCandidates.push(...parts);
  }

  // Express req.ips array (when trust proxy is enabled)
  if (Array.isArray(req.ips) && req.ips.length > 0) {
    rawCandidates.push(...req.ips);
  }

  rawCandidates.push(req.ip);
  rawCandidates.push(req.socket?.remoteAddress);

  const cleaned = rawCandidates
    .filter(val => typeof val === 'string' && val.trim().length > 0)
    .map(val => val.replace(/^::ffff:/, '').trim());

  // 1. Search for the first non-private, non-loopback public IP address
  const publicIp = cleaned.find(ip => !isPrivateOrLoopbackIp(ip));
  if (publicIp) return publicIp;

  // 2. If no public IP found (e.g. private LAN / VPN / testing), find first non-loopback IP
  const nonLoopback = cleaned.find(ip => !['127.0.0.1', '::1', 'localhost'].includes(ip.toLowerCase()));
  if (nonLoopback) return nonLoopback;

  // 3. Fallback for pure localhost development
  return cleaned[0] || '127.0.0.1';
}

/**
 * Standardized key generator for express-rate-limit that prevents
 * 127.0.0.1 collisions and IPv6 bypasses.
 */
export const rateLimitKeyGenerator = (req) => {
  const ip = getClientIp(req);
  return ipKeyGenerator(ip);
};
// In-memory cache for IP ASN / ISP lookups (max 5000 items)
export const ipIntelligenceCache = new Map();

/**
 * Enriches device context with real ISP / Network Carrier (e.g. Bharti Airtel, Jio, T-Mobile)
 * and network connection type (WiFi / Broadband vs Cellular / Mobile Data).
 */
export async function enrichNetworkInfo(device, ip) {
  if (!ip) return;
  const targetIp = ip.replace(/^::ffff:/, '').trim();
  if (isPrivateOrLoopbackIp(targetIp)) {
    if (device) {
      if (!device.networkCarrier) device.networkCarrier = 'WiFi / Local Network';
      if (!device.networkType) device.networkType = 'WiFi';
    }
    return;
  }

  if (ipIntelligenceCache.has(targetIp)) {
    const cached = ipIntelligenceCache.get(targetIp);
    if (device) {
      if (!device.networkCarrier && cached.carrier) device.networkCarrier = cached.carrier;
      if (!device.networkType && cached.type) device.networkType = cached.type;
    }
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`http://ip-api.com/json/${targetIp}?fields=status,isp,org,as,mobile`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        const carrier = data.isp || data.org || null;
        const type = data.mobile ? 'Cellular / Mobile Data' : 'WiFi / Broadband';
        if (ipIntelligenceCache.size > 5000) {
          const firstKey = ipIntelligenceCache.keys().next().value;
          ipIntelligenceCache.delete(firstKey);
        }
        ipIntelligenceCache.set(targetIp, { carrier, type });

        if (device) {
          if (!device.networkCarrier && carrier) device.networkCarrier = carrier;
          if (type) {
            const current = String(device.networkType || '').toLowerCase();
            if (!device.networkType || ['4g', '3g', '2g', 'slow-2g', 'high speed connection'].includes(current)) {
              device.networkType = type;
            }
          }
        }
      }
    }
  } catch (err) {
    // Non-blocking fail-safe: Never throw or disrupt audit logging
  }
}


/**
 * Device & Forensic Information Extractor
 * Extracts client IP, device type, OS, browser, geolocation headers, network carrier, and platform
 * for industry-grade audit trails on sensitive merchant and customer actions.
 */
export function extractDeviceContext(req) {
  const headers = req?.headers || {};
  const body = req?.body || {};

  // 1. Client IP Resolution (prioritizing Cloudflare, NGINX, mobile app headers, and reverse proxies)
  const ip = req?.realIp || getClientIp(req);

  // 2. Geolocation headers (explicit device headers from Flutter APK / Web, Cloudflare, Vercel, AWS CloudFront)
  let explicitLocation = headers['x-device-location'] || null;
  let explicitCity = headers['x-device-city'] || null;
  let explicitRegion = headers['x-device-region'] || null;
  let explicitCountry = headers['x-device-country'] || null;
  const lat = headers['x-device-lat'] || body.addressLat || null;
  const lng = headers['x-device-lng'] || body.addressLng || null;

  // Fallback to order delivery address if explicit geolocation headers are missing (e.g., guest checkouts)
  if (!explicitLocation && (body.address || body.deliveryAddress)) {
    const rawAddr = body.address || body.deliveryAddress;
    if (typeof rawAddr === 'string' && rawAddr.trim()) {
      explicitLocation = rawAddr.trim();
      const parts = rawAddr.split(',').map(p => p.trim());
      if (parts.length >= 3) {
        const countryPart = parts[parts.length - 1];
        const stateZipPart = parts[parts.length - 2];
        const cityPart = parts[parts.length - 3];
        if (!explicitCountry && countryPart) explicitCountry = countryPart;
        if (!explicitRegion && stateZipPart) {
          const stateMatch = stateZipPart.match(/^([A-Za-z\s]+)/);
          explicitRegion = stateMatch ? stateMatch[1].trim() : stateZipPart;
        }
        if (!explicitCity && cityPart) explicitCity = cityPart;
      } else if (parts.length === 2) {
        if (!explicitCity) explicitCity = parts[0];
        if (!explicitRegion) explicitRegion = parts[1];
      }
    } else if (typeof rawAddr === 'object') {
      if (!explicitCity && rawAddr.city) explicitCity = rawAddr.city;
      if (!explicitRegion && (rawAddr.state || rawAddr.region)) explicitRegion = rawAddr.state || rawAddr.region;
      if (!explicitCountry && rawAddr.country) explicitCountry = rawAddr.country;
      if (!explicitLocation) {
        explicitLocation = [rawAddr.street || rawAddr.line1, rawAddr.city, rawAddr.state, rawAddr.country].filter(Boolean).join(', ');
      }
    }
  }

  const city = headers['cf-ipcity'] || headers['x-vercel-ip-city'] || explicitCity || null;
  const region = headers['cf-region'] || headers['cf-region-code'] || headers['x-vercel-ip-country-region'] || explicitRegion || null;
  const country = headers['cf-ipcountry'] || headers['x-vercel-ip-country'] || headers['cloudfront-viewer-country'] || explicitCountry || null;

  // 3. User-Agent & Hardware / Software Fingerprint
  const ua = headers['user-agent'] || '';
  const xPlatform = headers['x-platform'] || req?.body?.orderSource || null;

  let deviceType = 'Desktop';
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';

  // Detect OS
  if (/windows nt 10\.0/i.test(ua)) os = 'Windows 10/11';
  else if (/windows nt 6\.3/i.test(ua)) os = 'Windows 8.1';
  else if (/windows nt 6\.1/i.test(ua)) os = 'Windows 7';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/iphone/i.test(ua)) os = 'iOS (iPhone)';
  else if (/ipad/i.test(ua)) os = 'iPadOS';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) {
    const androidMatch = ua.match(/android\s+([\d.]+)/i);
    os = androidMatch ? `Android ${androidMatch[1]}` : 'Android';
  } else if (/linux/i.test(ua)) os = 'Linux';

  // Support explicit device OS header if passed by native mobile app
  if (headers['x-device-os']) {
    os = `${headers['x-device-os']} ${headers['x-device-os-version'] || ''}`.trim();
  }

  // Detect Device Type
  if (/mobile|iphone|android.*mobile/i.test(ua) || xPlatform === 'merchant_app' || xPlatform === 'customer_app') {
    deviceType = 'Mobile';
  } else if (/ipad|tablet|android(?!.*mobile)/i.test(ua)) {
    deviceType = 'Tablet';
  } else {
    deviceType = 'Desktop';
  }

  // Detect Browser / App Client
  if (xPlatform === 'customer_app') {
    browser = 'Customer Mobile App';
  } else if (xPlatform === 'merchant_app') {
    browser = 'Merchant Mobile App';
  } else if (/dart|flutter|okhttp|mobile_app/i.test(ua)) {
    browser = 'Mobile App Client';
  } else if (/edg\//i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/chrome\//i.test(ua) && !/edg\//i.test(ua)) {
    browser = 'Google Chrome';
  } else if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) {
    browser = 'Apple Safari';
  } else if (/firefox\//i.test(ua)) {
    browser = 'Mozilla Firefox';
  } else if (ua.length > 0) {
    browser = ua.slice(0, 30);
  }

  const platform = xPlatform || (deviceType === 'Mobile' ? 'mobile_web' : 'web');

  // Check if IP is private/LAN (RFC 1918)
  const isPrivateIp = isPrivateOrLoopbackIp(ip);

  // 4. Cellular / SIM / ISP Network Carrier and Connection Type
  const cachedIntel = ipIntelligenceCache.get(ip);
  let networkCarrier =
    headers['x-network-carrier'] ||
    headers['x-carrier'] ||
    headers['x-sim-operator-name'] ||
    headers['cf-as-organization'] ||
    cachedIntel?.carrier ||
    (isPrivateIp ? 'WiFi / Local Router' : null);

  const rawNetworkType = headers['x-network-type'] || headers['x-connection-type'];
  let networkType = null;
  if (cachedIntel?.type) {
    networkType = cachedIntel.type;
  } else if (rawNetworkType && !['4g', '3g', '2g', 'slow-2g'].includes(String(rawNetworkType).toLowerCase())) {
    networkType = rawNetworkType;
  } else if (isPrivateIp) {
    networkType = 'WiFi / Local Network';
  } else if (rawNetworkType) {
    networkType = 'High Speed Connection';
  }

  // Clean location display: prioritize city/region/country, fallback to full address or GPS coordinates
  const locationParts = [city, region, country].filter(Boolean);
  const locationDisplay =
    (locationParts.length > 0 ? locationParts.join(', ') : null) ||
    explicitLocation ||
    (lat && lng ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : null) ||
    null;

  return {
    ip,
    platform,
    deviceType,
    os,
    browser,
    city,
    region,
    country,
    location: locationDisplay,
    locationDisplay,
    networkCarrier,
    networkType,
    userAgent: ua.slice(0, 300)
  };
}
