/**
 * Device & Forensic Information Extractor
 * Extracts client IP, device type, OS, browser, geolocation headers, network carrier, and platform
 * for industry-grade audit trails on sensitive merchant and customer actions.
 */

export function extractDeviceContext(req) {
  const headers = req.headers || {};

  // 1. Client IP Resolution (prioritizing Cloudflare and trusted reverse proxies)
  const forwardedFor = headers['x-forwarded-for'];
  const rawIp =
    headers['cf-connecting-ip'] ||
    headers['x-real-ip'] ||
    (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1';

  // Clean IPv6 mapped IPv4 format (e.g. ::ffff:192.168.1.1)
  const ip = rawIp.replace(/^::ffff:/, '');

  // 2. Geolocation headers (explicit device headers from Flutter APK / Web, Cloudflare, Vercel, AWS CloudFront)
  const explicitLocation = headers['x-device-location'] || null;
  const explicitCity = headers['x-device-city'] || null;
  const explicitRegion = headers['x-device-region'] || null;
  const explicitCountry = headers['x-device-country'] || null;

  const city = headers['cf-ipcity'] || headers['x-vercel-ip-city'] || explicitCity || null;
  const region = headers['cf-region'] || headers['cf-region-code'] || headers['x-vercel-ip-country-region'] || explicitRegion || null;
  const country = headers['cf-ipcountry'] || headers['x-vercel-ip-country'] || headers['cloudfront-viewer-country'] || explicitCountry || null;

  // 3. User-Agent & Hardware / Software Fingerprint
  const ua = headers['user-agent'] || '';
  const xPlatform = headers['x-platform'] || req.body?.orderSource || null;

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
  const isPrivateIp = /^(127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(ip);

  // 4. Cellular / SIM / ISP Network Carrier and Connection Type
  let networkCarrier =
    headers['x-network-carrier'] ||
    headers['x-carrier'] ||
    headers['x-sim-operator-name'] ||
    headers['cf-as-organization'] ||
    (isPrivateIp ? 'WiFi / Local Router' : null);

  let networkType =
    headers['x-network-type'] ||
    headers['x-connection-type'] ||
    (isPrivateIp ? 'WiFi' : null);

  // Clean location display: prioritize city/region/country, fallback to GPS coordinates
  const locationParts = [city, region, country].filter(Boolean);
  const locationDisplay =
    (locationParts.length > 0 ? locationParts.join(', ') : null) ||
    explicitLocation ||
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
