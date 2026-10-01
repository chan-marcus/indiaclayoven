import type { NextConfig } from "next";

// Dish photos uploaded from the dashboard are served from Supabase Storage.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/menu-images/**" }]
      : [],
  },
  experimental: {
    // Photos are shrunk in the browser first; this leaves room for a large
    // one that couldn't be, while staying under Vercel's 4.5 MB request cap.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
