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
  }
}

module.exports = nextConfig