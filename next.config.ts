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
  // Include Prisma binaries in the output for Vercel deployment
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/.prisma/client/**/*'],
  },
  // Handle CommonJS modules like pdf-parse
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
