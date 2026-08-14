/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5001/api/:path*',
      },
      {
        source: '/socket.io',
        destination: 'http://127.0.0.1:5001/socket.io/',
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://127.0.0.1:5001/socket.io/:path*',
      },
    ];
  },
}

module.exports = nextConfig;