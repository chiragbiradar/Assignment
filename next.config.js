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
};

module.exports = nextConfig;
