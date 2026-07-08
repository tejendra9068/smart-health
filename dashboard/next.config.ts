import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",   // Generate static files in out/ folder
  basePath: "/admin", // All routes prefixed with /admin
  trailingSlash: true, // Needed for static export to work with subdirs
  images: {
    unoptimized: true, // Required for static export (no Next.js image server)
  },
};

export default nextConfig;
