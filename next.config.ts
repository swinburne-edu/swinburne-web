import path from 'path'
import { fileURLToPath } from 'url'

import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const noindex = process.env.NOINDEX === 'true'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ...(noindex ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : []),
]

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // proxy.ts tự bỏ "/" cuối sau khi tra bảng redirect (redirect URL WordPress cũ chỉ 1 bước)
  skipTrailingSlashRedirect: true,
  // File tracing bỏ sót thư viện native của sharp (libvips .dll/.so) → chép đủ vào bản standalone
  outputFileTracingIncludes: {
    '/**': ['./node_modules/.pnpm/@img+sharp*/node_modules/@img/**/*'],
  },
  images: {
    // Ảnh lấy thẳng từ các size WebP Payload đã sinh — không tối ưu lại lúc chạy (CLAUDE.md mục 6)
    unoptimized: true,
  },
  async rewrites() {
    // Production: Nginx phục vụ /media trực tiếp, request không tới Next.
    // Local: chuyển sang endpoint file của Payload.
    return [{ source: '/media/:path*', destination: '/api/media/file/:path*' }]
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
