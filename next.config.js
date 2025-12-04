/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Enable for Docker deployment
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  turbopack: {},
  experimental: {},
  webpack: (config, { dev, isServer }) => {
    // WebSocket configuration for real-time features
    if (!isServer && !dev) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false
      }
    }
    
    return config
  },
  async headers() {
    return [
      {
        // Apply CORS headers to API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGINS || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,PATCH,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' }
        ]
      }
    ]
  }
}

export default nextConfig