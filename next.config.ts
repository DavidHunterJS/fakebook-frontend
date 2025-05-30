// next.config.ts
import type { NextConfig } from 'next';

// Define your S3 bucket details here for clarity and reuse
const s3BucketName = 'trippy.wtf'; // Ensure this is your exact bucket name
const s3Region = 'us-east-1';   // Ensure this is your exact bucket region

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        // For S3 path-style URLs (e.g., s3.region.amazonaws.com/bucketname/)
        // This is the primary pattern you should be relying on now.
        protocol: 'https',
        hostname: `s3.${s3Region}.amazonaws.com`, // e.g., s3.us-east-1.amazonaws.com
        port: '', // Explicitly empty as S3 uses default HTTPS port
        pathname: `/${s3BucketName}/**`,          // e.g., /trippy.wtf/**
      },
      {
        // For S3 virtual-hosted style URLs (e.g., bucketname.s3.region.amazonaws.com)
        // Corrected hostname. Keeping this for safety if any old URLs might still be generated or exist.
        protocol: 'https',
        hostname: `${s3BucketName}.s3.${s3Region}.amazonaws.com`, // e.g., trippy.wtf.s3.us-east-1.amazonaws.com
        port: '', // Explicitly empty
        pathname: '/**', // Allow any path within this specific bucket hostname
      },
      {
        protocol: 'https',
        hostname: 'fakebook-backend-a2a77a290552.herokuapp.com',
        port: '',
        pathname: '/**', // Optional: more specific if needed
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '', // Explicitly empty
        // port: '5000', // Or your specific local backend port if not 80
        pathname: '/**', // Optional: more specific if needed
      },
      // You had 'trippy.wtf' in your domains list. If it serves images directly:
      // {
      //   protocol: 'https', // Assuming https
      //   hostname: 'trippy.wtf',
      //   port: '',
      //   pathname: '/**',
      // },
    ],
  },
  
  // Add security headers and rate limiting
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            // Rate limiting header (informational)
            key: 'X-RateLimit-Limit',
            value: '100'
          },
        ],
      },
      {
        // Block access to sensitive files
        source: '/.env',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex'
          }
        ],
      },
      {
        // Block access to git files
        source: '/.git/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex'
          }
        ],
      },
    ]
  },

  // Redirect suspicious requests
  async redirects() {
    return [
      // Redirect common vulnerability scan paths to 404
      {
        source: '/.env',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/.git/:path*',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/wp-admin/:path*',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/phpinfo.php',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/.aws/:path*',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/config/:path*',
        destination: '/404',
        permanent: false,
      },
    ]
  },

  // ... any other configurations you might have for Next.js ...
};

export default nextConfig; // Use ES module export for .ts files