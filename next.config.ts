import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a production build run against a separate output folder while
  // `next dev` keeps serving from .next. Without this, building wipes the
  // dev server's compiled CSS.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  // Keep secrets out of the serverless bundle. Vercel gets them as env vars.
  outputFileTracingExcludes: {
    "*": [".env", ".env.local", ".env*.local"],
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async rewrites() {
    return [
      { source: "/favicon.ico", destination: "/brand/icon-48.png" },
      { source: "/apple-touch-icon.png", destination: "/brand/apple-touch-icon.png" },
      { source: "/apple-touch-icon-precomposed.png", destination: "/brand/apple-touch-icon.png" },
    ];
  },
};

export default nextConfig;
