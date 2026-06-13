import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/store",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "profile.line-scdn.net",
      },
      {
        protocol: "https",
        hostname: "**.line-scdn.net",
      },
    ],
  },
};

export default nextConfig;
