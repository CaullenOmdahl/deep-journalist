/** @type {import('next').NextConfig} */

const nextConfig = {
  // Disable ESLint in production builds
  eslint: {
    ignoreDuringBuilds: process.env.ESLINT_DISABLE === '1',
  },
  
  // Output as standalone for Docker
  output: process.env.NEXT_PUBLIC_BUILD_MODE === 'standalone' ? 'standalone' : undefined,
  
  // Use React compiler
  experimental: {
    reactCompiler: true,
  },
  
  // Disable type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Disable images (for now until we implement properly)
  images: {
    unoptimized: true,
  },

  // Server configuration to allow external connections
  server: {
    // Listen on all interfaces
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '3000'),
  },

  // Keep the development server running even when window loses focus
  webpackDevMiddleware: config => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }
    return config
  },
}

module.exports = nextConfig 