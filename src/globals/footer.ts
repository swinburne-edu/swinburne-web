import type { GlobalConfig } from 'payload'

import { anyone, isEditor } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Chân trang',
  admin: { group: 'Cấu hình chung' },
  access: { read: anyone, update: isEditor },
  fields: [
    {
      name: 'about',
      type: 'textarea',
      label: 'Giới thiệu ngắn',
      localized: true,
    },
    {
      name: 'quickLinks',
      type: 'array',
      label: 'Liên kết nhanh',
      localized: true,
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'url', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'social',
      type: 'array',
      label: 'Mạng xã hội',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'platform',
              type: 'select',
              required: true,
              options: ['facebook', 'youtube', 'instagram', 'tiktok', 'linkedin', 'zalo'],
            },
            { name: 'url', type: 'text', required: true },
          ],
        },
      ],
    },
    { name: 'copyright', type: 'text', label: 'Dòng bản quyền', localized: true },
  ],
  hooks: { afterChange: [revalidateGlobal('footer')] },
}
