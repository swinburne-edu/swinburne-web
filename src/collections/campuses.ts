import type { CollectionConfig } from 'payload'

import { editorialAccess } from '@/access'
import { draftVersions, legacyFields, slugField } from '@/fields/common'
import { revalidateCollection } from '@/hooks/revalidate'

export const Campuses: CollectionConfig = {
  slug: 'campuses',
  labels: { singular: 'Cơ sở', plural: 'Cơ sở' },
  access: editorialAccess,
  admin: { useAsTitle: 'name', group: 'Đào tạo', defaultColumns: ['name', 'city', 'phone'] },
  defaultPopulate: { name: true, slug: true, city: true, address: true, phone: true, email: true },
  versions: draftVersions,
  fields: [
    { name: 'name', type: 'text', label: 'Tên cơ sở', required: true, localized: true },
    {
      type: 'row',
      fields: [
        { name: 'city', type: 'text', label: 'Thành phố', required: true },
        { name: 'phone', type: 'text', label: 'Điện thoại' },
        { name: 'email', type: 'email', label: 'Email' },
      ],
    },
    { name: 'address', type: 'textarea', label: 'Địa chỉ', localized: true, required: true },
    { name: 'mapUrl', type: 'text', label: 'Link Google Maps' },
    { name: 'facebookUrl', type: 'text', label: 'Link Facebook' },
    { name: 'images', type: 'upload', relationTo: 'media', hasMany: true, label: 'Hình ảnh' },
    { name: 'description', type: 'richText', label: 'Giới thiệu', localized: true },
    { name: 'sortOrder', type: 'number', label: 'Thứ tự hiển thị', admin: { position: 'sidebar' } },
    slugField('name'),
    ...legacyFields,
  ],
  // Cơ sở xuất hiện ở footer + JSON-LD toàn site
  hooks: revalidateCollection('campuses'),
}
