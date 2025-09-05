import type { NextConfig } from "next";
// Temporarily disable next-intl plugin for debugging
// import createNextIntlPlugin from 'next-intl/plugin';
// const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Optimize for production
  reactStrictMode: true,

  // Image optimization
  images: {
    domains: ["loremflickr.com", "picsum.photos"],
    formats: ["image/avif", "image/webp"],
  },

  // App configuration
  experimental: {
    // Enable optimizations (optimizeCss disabled due to critters dependency issue)
    // optimizeCss: true,
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // API route configuration for serverless
  async rewrites() {
    return [];
  },
};

export default nextConfig;
// export default withNextIntl(nextConfig);
