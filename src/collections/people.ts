import type { CollectionConfig } from 'payload'

import { editorialAccess } from '@/access'
import { draftVersions, legacyFields, slugField } from '@/fields/common'
import { revalidateCollection } from '@/hooks/revalidate'

export const People: CollectionConfig = {
  slug: 'people',
  labels: { singular: 'Giảng viên / nhân sự', plural: 'Giảng viên & nhân sự' },
  access: editorialAccess,
  admin: {
    useAsTitle: 'name',
    group: 'Nghiên cứu & Doanh nghiệp',
    defaultColumns: ['name', 'title'],
  },
  defaultPopulate: { name: true, title: true, photo: true, slug: true },
  versions: draftVersions,
  fields: [
    { name: 'name', type: 'text', label: 'Họ tên', required: true },
    { name: 'title', type: 'text', label: 'Chức danh', localized: true },
    { name: 'photo', type: 'upload', relationTo: 'media', label: 'Ảnh' },
    { name: 'bio', type: 'richText', label: 'Tiểu sử', localized: true },
    { name: 'expertise', type: 'textarea', label: 'Lĩnh vực chuyên môn', localized: true },
    { name: 'sortOrder', type: 'number', label: 'Thứ tự hiển thị', admin: { position: 'sidebar' } },
    slugField('name', false),
    ...legacyFields,
  ],
  hooks: revalidateCollection('people'),
}
