import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits a minimal, self-contained server bundle at `.next/standalone/` so
  // the Docker runtime image only needs that folder + `.next/static` + `public`
  // — no `node_modules` copy, keeping the image ~120 MB instead of ~500 MB.
  output: 'standalone',
};

export default nextConfig;
