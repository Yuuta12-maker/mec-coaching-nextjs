/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // react-big-calendarのスタイルをロードできるように設定
  transpilePackages: ['react-big-calendar'],
};

module.exports = nextConfig;