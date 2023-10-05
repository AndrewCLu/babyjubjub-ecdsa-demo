/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["babyjubjub-ecdsa"],
  webpack: (config, options) => {
    // if (!options.isServer) {
    //   config.resolve.fallback = { fs: false, readline: false };
    // }
    // config.experiments = { asyncWebAssembly: true, layers: true };
    config.resolve.fallback = { fs: false, readline: false };
    return config;
  },
};

module.exports = nextConfig;
