/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
      {
        protocol: "https",
        hostname: "*.github.com",
      },
    ],
  },
  // Use webpack memory cache in dev — avoids OneDrive disk sync mtime corruption
  // while keeping compiled modules warm in RAM for near-instant route switching.
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = {
        type: "memory",
      };
    }
    return config;
  },
  // Required for Next.js 16 — silences Turbopack build error when webpack config is present
  turbopack: {},
};

module.exports = nextConfig;
