import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "@qdrant/js-client-rest"],
};

export default nextConfig;
