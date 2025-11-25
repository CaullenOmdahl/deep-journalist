/** @type {import('next').NextConfig} */

const nextConfig = {
  // Output as standalone for Docker
  output: process.env.NEXT_PUBLIC_BUILD_MODE === 'standalone' ? 'standalone' : undefined,

  // React Compiler (moved from experimental in Next.js 16)
  reactCompiler: true,

  // Disable type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Disable images optimization (for static export compatibility)
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
