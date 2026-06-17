import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [375, 425, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },

  experimental: {
    optimisticClientCache: true,
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Link", value: '</manifest.json>; rel="manifest"' },
          { key: "Viewport-Fit", value: "cover" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' http://localhost:5000 http://localhost:3000 res.cloudinary.com;",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },

  allowedDevOrigins: ["192.168.157.43", "192.168.183.43"],

  compress: true,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
};

export default nextConfig;
