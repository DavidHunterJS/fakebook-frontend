import type { NextConfig } from 'next';

// --- S3 BUCKET CONFIGURATION ---
const s3BucketName = 'trippy.wtf';
const s3Region = 'us-east-1';

// --- NEXT.JS CONFIGURATION ---
const nextConfig: NextConfig = {
  reactStrictMode: true,

  //================================================
  // Image Optimization
  //================================================
  images: {
    remotePatterns: [
      {
        // AWS S3: Path-style URL (s3.region.amazonaws.com/bucket-name/)
        protocol: 'https',
        hostname: `s3.${s3Region}.amazonaws.com`,
        pathname: `/${s3BucketName}/**`,
      },
      {
        // AWS S3: Virtual-hosted style URL (bucket-name.s3.region.amazonaws.com)
        protocol: 'https',
        hostname: `${s3BucketName}.s3.${s3Region}.amazonaws.com`,
        pathname: '/**',
      },
      {
        // Heroku Backend
        protocol: 'https',
        hostname: 'fakebook-backend-a2a77a290552.herokuapp.com',
        pathname: '/**',
      },
      {
        // Local Development Backend
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
    ],
  },

  //================================================
  // Webpack Customization
  //================================================
  webpack: (config, { webpack }) => {
    // Provides browser-compatible polyfills for Node.js core modules.
    // This is essential for libraries that might expect a Node.js environment.
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      })
    );

    // Prevents errors from libraries that try to use Node.js modules on the client-side.
    // Setting them to `false` tells Webpack to provide an empty module.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };

    return config;
  },
  
  //================================================
  // Security Headers
  //================================================
  async headers() {
    return [
      {
        // Apply these security headers to all routes.
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      {
        // Block search engine indexing of sensitive files.
        source: '/(.*)?(.env|.git)',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
    ];
  },

  //================================================
  // Redirects for Security
  //================================================
  async redirects() {
    return [
      // Redirects common vulnerability scanning paths to a 404 page.
      { source: '/.env', destination: '/404', permanent: false },
      { source: '/.git/:path*', destination: '/404', permanent: false },
      { source: '/.aws/:path*', destination: '/404', permanent: false },
      { source: '/config/:path*', destination: '/404', permanent: false },
      { source: '/wp-admin/:path*', destination: '/404', permanent: false },
      { source: '/phpinfo.php', destination: '/404', permanent: false },
    ];
  },
};

export default nextConfig;