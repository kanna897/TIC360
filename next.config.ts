import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep static generation deterministic on Windows environments where parallel
  // workers can race while creating route segment directories.
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;
