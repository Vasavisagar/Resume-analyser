import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default (phase: string): NextConfig => ({
  reactStrictMode: true,
  devIndicators: false,
  // Keep dev manifests isolated from production build artifacts on OneDrive.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
});
