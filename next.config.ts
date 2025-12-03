import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        pathname: '/api/portraits/**',
      },
    ],
  },
  // Optimize for serverless - don't externalize Prisma
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
