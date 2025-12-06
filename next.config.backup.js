/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactCompiler: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NODE_ENV: process.env.NODE_ENV || 'production',
  }
};

export default nextConfig;