import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

// Builds app/sw.ts into public/sw.js (webpack only; the build runs `next build --webpack`).
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {};

export default withSerwist(nextConfig);
