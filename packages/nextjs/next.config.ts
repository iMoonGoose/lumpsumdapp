import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: '../../docs',
  basePath: process.env.NODE_ENV === 'production' ? '/lumpsumdapp' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/lumpsumdapp/' : '',
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
  allowedDevOrigins: ["192.168.0.*", "0.0.0.0"],
};

const isIpfs = process.env.NEXT_PUBLIC_IPFS_BUILD === "true";

if (isIpfs) {
  nextConfig.output = "export";
  nextConfig.trailingSlash = true;
  nextConfig.images = {
    unoptimized: true,
  };
}

module.exports = nextConfig;
