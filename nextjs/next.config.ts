import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/store",
  output: "standalone",
  env: {
    NEXT_PUBLIC_BASE_PATH: "/store",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
