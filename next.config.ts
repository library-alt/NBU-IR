/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // ปิดการแจ้งเตือนเรื่อง Turbopack
  turbopack: {},
};

export default nextConfig;