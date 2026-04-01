/** @type {import('next').NextConfig} */

const nextConfig = {
    compiler: {
      // Remove all console logs
      removeConsole: false,
    },
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = { fs: false, ...config.resolve.fallback };
      }
      return config;
    },  
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'github.com',
          },
          {
            protocol: 'https',
            hostname: 'ipfs.io',
          },
          {
            protocol: 'https',
            hostname: 'ipfsmsg.teia.art',
          }
        ],
    },
    experimental: {
      serverActions: {
          bodySizeLimit: '5mb',
      }
  }
  };

export default nextConfig;
