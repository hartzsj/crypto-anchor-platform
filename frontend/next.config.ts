import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许开发模式下通过不同域名访问
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};

export default nextConfig;
