import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  assetPrefix:
    process.env.NODE_ENV === 'production'
      ? 'https://dropship-academy-shopify-api.jndegens.chatgpt.site'
      : undefined,
};

export default nextConfig;
