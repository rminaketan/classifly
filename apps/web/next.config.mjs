/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Allow workspace packages to import without bundler complaints.
    externalDir: true,
  },
  transpilePackages: ['@classifly/db', '@classifly/shared', '@classifly/ui'],
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: 'media.classifly.in' },
      { protocol: 'https', hostname: 'media-dev.classifly.in' },
    ],
  },
};
export default nextConfig;
