/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force standalone output for Docker
  output: 'standalone',
  
  // Disable telemetry
  telemetry: false,
  
  // Force production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Updated experimental features for Next.js 16 (without deprecated options)
  experimental: {
    reactCompiler: false,
    ppr: false,
    dynamicIO: false,
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
  
  // Webpack configuration (explicit webpack mode)
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle React 19 compatibility issues
    config.resolve.alias = {
      ...config.resolve.alias,
      'react': require.resolve('react'),
      'react-dom': require.resolve('react-dom'),
    };
    
    // Ignore specific warnings for React 19
    config.ignoreWarnings = [
      { message: /Failed to parse source map/ },
      { message: /Module not found: Can't resolve 'encoding'/ },
    ];
    
    return config;
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