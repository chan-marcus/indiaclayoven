import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable caching for Cloudflare Pages compatibility
  onDemandEntries: {
    maxInactiveAge: 1000 * 60,
    pagesBufferLength: 5,
  },
  cacheMaxMemorySize: 0, // Disable memory cache
};

export default nextConfig;
