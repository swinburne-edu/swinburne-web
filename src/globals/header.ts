import type { GlobalConfig } from 'payload'

import { anyone, isEditor } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Menu đầu trang',
  admin: { group: 'Cấu hình chung' },
  access: { read: anyone, update: isEditor },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      label: 'Mục menu chính',
      maxRows: 7,
      localized: true,
      admin: { description: 'Tối đa 7 mục. Mỗi ngôn ngữ có menu riêng.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', label: 'Tên mục', required: true },
            { name: 'url', type: 'text', label: 'Đường dẫn' },
          ],
        },
        {
          name: 'children',
          type: 'array',
          label: 'Menu con',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', label: 'Tên', required: true },
                { name: 'url', type: 'text', label: 'Đường dẫn', required: true },
                { name: 'external', type: 'checkbox', label: 'Mở tab mới' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'cta',
      type: 'group',
      label: 'Nút kêu gọi (CTA)',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', label: 'Chữ trên nút', localized: true },
            {
              name: 'url',
              type: 'text',
              label: 'Đường dẫn',
              localized: true,
              admin: { description: 'Trang có form đăng ký (dự phòng khi trình duyệt tắt JS).' },
            },
          ],
        },
      ],
    },
    {
      name: 'utilityLinks',
      type: 'array',
      label: 'Link tiện ích (thanh trên cùng)',
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
  ],
  hooks: { afterChange: [revalidateGlobal('header')] },
}
