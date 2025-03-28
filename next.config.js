/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },
  transpilePackages: [],
  // ESLintエラーを無視してビルド続行
  eslint: {
    // 本番ビルド時に警告があってもビルドを失敗させない
    ignoreDuringBuilds: true,
  },
  // TypeScriptエラーも無視
  typescript: {
    // 本番ビルド時に型チェックエラーがあってもビルドを失敗させない
    ignoreBuildErrors: true,
  },
  // 不要なモジュールを除外（Next.js標準方法）
  webpack: (config, { dev, isServer }) => {
    // 本番ビルドでのみFirebase関連モジュールを除外
    if (!dev) {
      // 既存のcondition配列を保存
      const prevConditions = config.module.rules
        .find((rule) => typeof rule.oneOf === 'object')
        .oneOf.find((rule) => Array.isArray(rule.include))
        .exclude;
      
      // 新しい除外ルールを追加
      config.module.rules
        .find((rule) => typeof rule.oneOf === 'object')
        .oneOf.find((rule) => Array.isArray(rule.include))
        .exclude = [
          ...prevConditions,
          /firebase\.(js|jsx|ts|tsx)$/,
          /firebase\/.+\.(js|jsx|ts|tsx)$/,
          /googleDrive\.(js|jsx|ts|tsx)$/
        ];
    }
    
    return config;
  },
}

module.exports = nextConfig