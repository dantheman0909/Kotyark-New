/** @type {import('next').NextConfig} */
const nextConfig = {
  // NEXT_DIST_DIR lets parallel local builds (e.g. multiple worktrees) avoid clobbering each other.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  serverExternalPackages: ['better-sqlite3', 'pdf-parse', '@replit/object-storage'],
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
