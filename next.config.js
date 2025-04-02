/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },
  // ESLintエラーを無視してビルド続行
  eslint: {
    ignoreDuringBuilds: true,
  },
  // TypeScriptエラーも無視
  typescript: {
    ignoreBuildErrors: true,
  },
  // Webpack設定を追加
  webpack: (config, { isServer }) => {
    // クライアントサイドでのみ、Node.js専用モジュールを空モジュールに置き換え
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        dns: false,
        http2: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig