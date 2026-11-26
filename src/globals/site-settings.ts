import type { GlobalConfig } from 'payload'

import { anyone, isAdmin } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate'

export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  label: 'Cài đặt website',
  admin: { group: 'Cấu hình chung' },
  access: { read: anyone, update: isAdmin },
  fields: [
    { name: 'siteName', type: 'text', label: 'Tên website', localized: true, required: true },
    { name: 'tagline', type: 'text', label: 'Khẩu hiệu', localized: true },
    {
      name: 'organizationDescription',
      type: 'textarea',
      label: 'Mô tả tổ chức (dùng cho SEO / JSON-LD)',
      localized: true,
    },
    { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo' },
    {
      name: 'defaultOgImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Ảnh chia sẻ mặc định (1200×630)',
    },
    { name: 'generalEmail', type: 'email', label: 'Email chung' },
    {
      name: 'gtmId',
      type: 'text',
      label: 'Google Tag Manager ID',
      admin: { description: 'Dạng GTM-XXXXXXX. Đây là mã theo dõi DUY NHẤT trên site.' },
      validate: (v: unknown) =>
        !v || (typeof v === 'string' && /^GTM-[A-Z0-9]+$/.test(v)) ? true : 'Định dạng GTM-XXXXXXX',
    },
    {
      name: 'turnstileSiteKey',
      type: 'text',
      label: 'Cloudflare Turnstile site key',
      admin: { description: 'Để trống để dùng biến môi trường TURNSTILE_SITE_KEY.' },
    },
    {
      name: 'externalLinks',
      type: 'group',
      label: 'Link hệ thống ngoài',
      fields: [
        { name: 'canvas', type: 'text', defaultValue: 'https://swinburne.instructure.com/' },
        { name: 'admissions', type: 'text', defaultValue: 'https://tuyensinh.swin.edu.vn' },
        { name: 'download', type: 'text', defaultValue: 'https://download.swinburne-vn.edu.vn' },
        { name: 'showcase', type: 'text', defaultValue: 'https://showcase.swinburne-vn.edu.vn' },
      ],
    },
  ],
  hooks: { afterChange: [revalidateGlobal('siteSettings')] },
}
