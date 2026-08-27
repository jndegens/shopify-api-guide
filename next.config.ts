import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  assetPrefix:
    process.env.NODE_ENV === 'production'
      ? '/shopify-api'
      : undefined,
};

export default nextConfig;
