import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a production build run against a separate output folder while
  // `next dev` keeps serving from .next. Without this, building wipes the
  // dev server's compiled CSS.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async rewrites() {
    return [
      { source: "/favicon.ico", destination: "/icon.svg" },
      { source: "/apple-touch-icon.png", destination: "/icon.svg" },
      { source: "/apple-touch-icon-precomposed.png", destination: "/icon.svg" },
    ];
  },
};

export default nextConfig;
