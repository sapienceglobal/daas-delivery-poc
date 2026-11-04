import fs from 'fs';

let content = fs.readFileSync('backend/src/app.js', 'utf8');

// 1. Add import
if (!content.includes('rateLimitKeyGenerator')) {
  content = content.replace(
    /import tenantDb from '\.\/middleware\/tenantDb\.js';\r?\n/,
    "import tenantDb from './middleware/tenantDb.js';\r\nimport { getClientIp, rateLimitKeyGenerator } from './utils/deviceInfo.js';\r\n"
  );
}

// 2. Update trust proxy and add early IP middleware
content = content.replace(
  /\/\/ Always trust reverse proxies \(NGINX, Cloudflare, Load Balancer\) so client IP is accurately extracted\r?\napp\.set\('trust proxy', true\);/,
  `// Trust reverse proxies (NGINX, Cloudflare, Next.js rewrites, Docker bridge)
// Configures Express to trust loopback (127.0.0.1, ::1) and private subnets (RFC 1918)
const trustProxySetting = process.env.TRUST_PROXY || 'loopback, linklocal, uniquelocal';
app.set('trust proxy', trustProxySetting === '1' ? 1 : trustProxySetting === 'true' ? true : trustProxySetting);

// Resolve real client IP early on every incoming request
app.use((req, _res, next) => {
  req.realIp = getClientIp(req);
  next();
});`
);

// 3. Update apiLimiter
content = content.replace(
  /(const apiLimiter = rateLimit\(\{[\s\S]*?legacyHeaders: false,)(\r?\n)(\s*skip:)/,
  `$1$2  keyGenerator: rateLimitKeyGenerator,$2  validate: { keyGeneratorIpFallback: false },$2$3`
);

// 4. Update loginLimiter
content = content.replace(
  /(const loginLimiter = rateLimit\(\{[\s\S]*?skipSuccessfulRequests: true,.*?)(\r?\n)(\}\);)/,
  `$1$2  keyGenerator: rateLimitKeyGenerator,$2  validate: { keyGeneratorIpFallback: false },$2$3`
);

// 5. Update registerLimiter
content = content.replace(
  /(const registerLimiter = rateLimit\(\{[\s\S]*?legacyHeaders: false,)(\r?\n)(\}\);)/,
  `$1$2  keyGenerator: rateLimitKeyGenerator,$2  validate: { keyGeneratorIpFallback: false },$2$3`
);

// 6. Update forgotPasswordLimiter
content = content.replace(
  /(const forgotPasswordLimiter = rateLimit\(\{[\s\S]*?legacyHeaders: false,)(\r?\n)(\}\);)/,
  `$1$2  keyGenerator: rateLimitKeyGenerator,$2  validate: { keyGeneratorIpFallback: false },$2$3`
);

fs.writeFileSync('backend/src/app.js', content, 'utf8');
console.log('Successfully updated backend/src/app.js');

