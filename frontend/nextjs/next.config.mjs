/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 'www.google.com',
      },
      {
        hostname: 'www.google-analytics.com',
      }
    ],
  },
  swcMinify: true,
  experimental: {
    forceSwcTransforms: true
  },
  output: 'standalone',
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Force SWC loader for all JavaScript and TypeScript files
    const rules = config.module.rules;
    rules.forEach(rule => {
      if (rule.test && (rule.test.test('.ts') || rule.test.test('.js'))) {
        if (Array.isArray(rule.use)) {
          rule.use = rule.use.map(loader => {
            if (loader.loader === 'babel-loader') {
              return {
                loader: 'next-swc-loader',
                options: {}
              };
            }
            return loader;
          });
        }
      }
    });
    return config;
  }
}

export default nextConfig;
