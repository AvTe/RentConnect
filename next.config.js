/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance Optimizations
  experimental: {
    missingSuspenseWithCSRBailout: false,
    optimizePackageImports: ['lucide-react'],
  },
  
  // Image Optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },

  // Compression & Minification
  compress: true,
  productionBrowserSourceMaps: false,

  // Headers for better caching and security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  // Redirects for performance
  async redirects() {
    return [];
  },

  // Bundle Analysis (enable with: ANALYZE=true npm run build)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer }) => {
      const TerserPlugin = require('terser-webpack-plugin');
      if (!isServer) {
        config.optimization.minimizer = [
          new TerserPlugin({
            terserOptions: {
              compress: { drop_console: true },
            },
          }),
        ];
      }
      return config;
    },
  }),
};

module.exports = nextConfig;
