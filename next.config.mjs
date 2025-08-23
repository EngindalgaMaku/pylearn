/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      // Increase body size limit for bulk image uploads (default is 1mb)
      bodySizeLimit: '16mb',
    },
  },
}

export default nextConfig
