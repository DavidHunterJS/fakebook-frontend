// next.config.js
const s3BucketName = 'trippy.wtf';
const s3Region = 'us-east-1';

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: `s3.${s3Region}.amazonaws.com`, // e.g., s3.us-east-1.amazonaws.com
        pathname: `/${s3BucketName}/**`,          // e.g., /trippy.wtf/**
      },
      // ... other necessary hostnames ...
      { // Keep this for safety if some old virtual-hosted URLs might still be generated or exist
        protocol: 'https',
        hostname: `<span class="math-inline">\{s3BucketName\}\.s3\.</span>{s3Region}.amazonaws.com`,
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fakebook-backend-a2a77a290552.herokuapp.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};
module.exports = nextConfig;