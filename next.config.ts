/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'fakebook-backend-a2a77a290552.herokuapp.com', // Your Heroku backend (if it serves some images)
      'localhost', // For local development, if backend serves images on localhost
      'trippy.wtf', // Your custom domain (if it directly serves images or proxies)
      'trippy.wtf.s3.us-east-1.amazonaws.com', // <<<--- ADDED THIS LINE (Your S3 bucket hostname)
      // Add any other specific S3 bucket hostnames if you have more
    ],
  },
  // You can also use remotePatterns (newer, more flexible way):
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'fakebook-backend-a2a77a290552.herokuapp.com',
  //     },
  //     {
  //       protocol: 'http', // Or https if your local backend uses it
  //       hostname: 'localhost',
  //     },
  //     {
  //       protocol: 'https', // Assuming your custom domain uses https
  //       hostname: 'trippy.wtf',
  //     },
  //     {
  //       protocol: 'https',
  //       hostname: 'trippy.wtf.s3.us-east-1.amazonaws.com',
  //     },
  //   ],
  // },
}

module.exports = nextConfig;  