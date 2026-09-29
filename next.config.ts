import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' ${isProd ? '' : "'unsafe-eval'"} 'unsafe-inline'`.trim(),
  "style-src 'self' 'unsafe-inline'",
  'img-src \'self\' data: https://images.unsplash.com https://plus.unsplash.com https://cdn.shopify.com https://res.cloudinary.com',
  "font-src 'self'",
  "connect-src 'self' http://localhost:* https://*",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: cspDirectives,
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    const rawBackendUrl =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:5000/api/v1';
    
    // Normalize root url without /api/v1 trailing segment
    const backendRoot = rawBackendUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');

    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendRoot}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

