import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker: .next/standalone trae un server.js y solo los node_modules que usa
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
