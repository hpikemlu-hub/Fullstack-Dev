/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force standalone output for Docker
  output: 'standalone',
  
  // Disable telemetry
  telemetry: false,
  
  // Force production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Updated experimental features for Next.js 16
  experimental: {
    reactCompiler: false,
    ppr: false,
    dynamicIO: false,
    // Remove serverComponentsExternalPackages - moved to root level
  },
  
  // Move serverComponentsExternalPackages to root level as serverExternalPackages
  serverExternalPackages: [
    // Add any external packages that should be excluded from bundling
  ],
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['app', 'components', 'lib', 'hooks']
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Turbopack configuration (replaces webpack)
  turbo: {
    // Turbopack-specific configuration
    rules: {
      // Add any specific rules for Turbopack if needed
    },
    resolveAlias: {
      // Handle React 19 compatibility
      'react': require.resolve('react'),
      'react-dom': require.resolve('react-dom'),
    },
  },
  
  // Environment variables
  env: {
    NODE_ENV: process.env.NODE_ENV || 'production',
  },
  
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