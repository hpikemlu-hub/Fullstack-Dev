/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force standalone output for Docker
  output: 'standalone',
  
  // Force production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Experimental features for Next.js 14 stability
  experimental: {
    serverComponentsExternalPackages: [
      // Add any external packages that should be excluded from bundling
    ],
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Remove turbopack for Next.js 14 stability
  
  // Image optimization
  images: {
    unoptimized: false,
    domains: [],
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;