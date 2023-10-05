/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = { fs: false, readline: false };
    return config;
  },
};

module.exports = nextConfig;
