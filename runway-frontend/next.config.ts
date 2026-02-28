import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  rewrites: async () => {
    return [
      {
        source: "/api/:path*",
        destination: "/backend/index.py",
      },
    ];
  },
};

export default nextConfig;
