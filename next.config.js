/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Resolve punycode to the userland version
    config.resolve.alias = {
      ...config.resolve.alias,
      punycode: 'punycode/',
    };

    return config;
  },
  // Add this to disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add a consistent build ID
  generateBuildId: async () => {
    // You can use any string here, or a git hash if available
    return 'Periskope-clone-build';
  },
  // Add TypeScript type checking skip
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Configure allowed image domains for next/image
  images: {
    domains: ['tjrvzczdpejczcwiwjyj.supabase.co'],
  },
};

module.exports = nextConfig;
