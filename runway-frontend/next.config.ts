import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  rewrites: async () => {
    return [
      {
        source: "/api/:path*",
        destination: process.env.NODE_ENV === "development"
          ? "http://localhost:8000/api/:path*"
          : "/backend/index.py",
      },
    ];
  },
};

export default nextConfig;
