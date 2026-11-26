import type { CollectionConfig } from 'payload'

import { editorialAccess } from '@/access'
import { draftVersions, legacyFields, slugField } from '@/fields/common'
import { revalidateCollection } from '@/hooks/revalidate'

export const Majors: CollectionConfig = {
  slug: 'majors',
  labels: { singular: 'Ngành', plural: 'Ngành học' },
  access: editorialAccess,
  admin: {
    useAsTitle: 'title',
    group: 'Đào tạo',
    defaultColumns: ['title', 'program', '_status', 'updatedAt'],
  },
  defaultPopulate: { title: true, slug: true, summary: true, heroImage: true, program: true },
  versions: draftVersions,
  fields: [
    { name: 'title', type: 'text', label: 'Tên ngành', required: true, localized: true },
    {
      name: 'program',
      type: 'relationship',
      relationTo: 'programs',
      label: 'Thuộc chương trình',
      required: true,
      index: true,
    },
    { name: 'summary', type: 'textarea', label: 'Tóm tắt', localized: true },
    { name: 'heroImage', type: 'upload', relationTo: 'media', label: 'Ảnh đầu trang' },
    { name: 'body', type: 'richText', label: 'Nội dung', localized: true },
    {
      name: 'careers',
      type: 'array',
      label: 'Cơ hội nghề nghiệp',
      localized: true,
      fields: [{ name: 'title', type: 'text', label: 'Vị trí', required: true }],
    },
    {
      name: 'subjects',
      type: 'relationship',
      relationTo: 'subjects',
      hasMany: true,
      label: 'Môn học',
    },
    { name: 'sortOrder', type: 'number', label: 'Thứ tự hiển thị', admin: { position: 'sidebar' } },
    slugField(),
    ...legacyFields,
  ],
  hooks: revalidateCollection('majors', ['collection:programs']),
}
