/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },
  transpilePackages: [],
  webpack: (config, { isServer }) => {
    // Firebase関連モジュールのビルドを無視（必要に応じて）
    config.module.rules.push({
      test: /firebase\.(js|ts)$|firebase\/.+\.(js|ts)$|googleDrive\.(js|ts)$/,
      use: 'null-loader',
      include: /lib/,
    });
    
    return config;
  },
}

module.exports = nextConfig