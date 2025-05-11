/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'fakebook-backend-a2a77a290552.herokuapp.com',
      'localhost',
      'trippy.wtf'
    ],
  },
}

module.exports = nextConfig