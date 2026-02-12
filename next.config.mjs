/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  allowedDevOrigins: [
    process.env.REPLIT_DEV_DOMAIN,
  ].filter(Boolean),
};

export default nextConfig;

