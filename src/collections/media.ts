import path from 'path'
import type { CollectionConfig } from 'payload'

import { publicReadEditorWrite } from '@/access'
import { legacyFields } from '@/fields/common'

/** Thư mục lưu file: MEDIA_DIR (local ./media, production /var/www/swin/media). */
export const mediaDir = path.resolve(process.cwd(), process.env.MEDIA_DIR || 'media')

const webp = (quality: number) => ({ format: 'webp' as const, options: { quality } })

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Ảnh / tệp', plural: 'Thư viện ảnh & tệp' },
  access: publicReadEditorWrite,
  admin: {
    group: 'Thư viện',
    defaultColumns: ['filename', 'alt', 'mimeType', 'updatedAt'],
    description: 'Ảnh JPG/PNG tự chuyển sang WebP và sinh 4 kích thước. SVG và PDF giữ nguyên.',
  },
  upload: {
    staticDir: mediaDir,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf'],
    resizeOptions: { width: 2560, withoutEnlargement: true },
    formatOptions: webp(80),
    withMetadata: false,
    focalPoint: true,
    adminThumbnail: 'thumb',
    // Mỗi size tự khai formatOptions (tránh lỗi thứ tự size — CLAUDE.md mục 6)
    imageSizes: [
      { name: 'thumb', width: 400, height: 300, formatOptions: webp(75) },
      { name: 'card', width: 800, height: 600, formatOptions: webp(78) },
      { name: 'content', width: 1200, formatOptions: webp(80) },
      { name: 'hero', width: 1920, height: 800, formatOptions: webp(80) },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Mô tả ảnh (alt)',
      required: true,
      localized: true,
      admin: { description: 'Mô tả ngắn nội dung ảnh cho người khiếm thị và Google.' },
    },
    { name: 'caption', type: 'text', label: 'Chú thích', localized: true },
    { name: 'contentHash', type: 'text', index: true, admin: { hidden: true } },
    ...legacyFields,
  ],
}
