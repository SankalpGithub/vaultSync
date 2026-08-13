import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:3000/api/v1/auth/:path*",
      },
    ];
  },
};

export default nextConfig;
