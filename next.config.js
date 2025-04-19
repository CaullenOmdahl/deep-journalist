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

  // These properties have been moved to a different location or are no longer needed in Next.js 15+
  // The server options can be configured through environment variables:
  // - HOST=0.0.0.0 npm run dev (for host)
  // - PORT=3000 npm run dev (for port)
}

module.exports = nextConfig