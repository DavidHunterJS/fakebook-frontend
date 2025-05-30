// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter (consider Redis for production)
const rateLimit = new Map();

// Suspicious paths that bots commonly scan
const SUSPICIOUS_PATHS = [
  '.env', '.git', 'wp-admin', 'wp-config', 'phpinfo',
  '.aws', 'config.', '/admin/', '/api/config',
  'composer.', 'package-lock', 'yarn.lock'
];

// Known malicious IPs (add more as needed)
const BLOCKED_IPS = [
  '185.177.72.202', // From your logs
];

export function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const path = request.nextUrl.pathname;
  const now = Date.now();

  // Block known malicious IPs
  if (BLOCKED_IPS.includes(ip)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Check for suspicious paths
  const isSuspicious = SUSPICIOUS_PATHS.some(suspPath => 
    path.toLowerCase().includes(suspPath.toLowerCase())
  );

  if (isSuspicious) {
    console.warn(`[Security] Suspicious request: ${path} from ${ip}`);
    return new NextResponse('Not Found', { status: 404 });
  }

  // Rate limiting
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100; // 100 requests per minute

  const userKey = `${ip}:${Math.floor(now / windowMs)}`;
  const requests = rateLimit.get(userKey) || 0;

  if (requests >= maxRequests) {
    console.warn(`[RateLimit] IP ${ip} exceeded rate limit`);
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Math.ceil(now / windowMs) * windowMs).toISOString(),
      }
    });
  }

  // Update request count
  rateLimit.set(userKey, requests + 1);

  // Clean up old entries
  if (Math.random() < 0.01) { // 1% chance to clean up
    const cutoff = now - windowMs * 2;
    for (const [key, _] of rateLimit) {
      const [, timestamp] = key.split(':');
      if (parseInt(timestamp) * windowMs < cutoff) {
        rateLimit.delete(key);
      }
    }
  }

  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};