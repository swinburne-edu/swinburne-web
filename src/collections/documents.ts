import type { CollectionConfig } from 'payload'

import { editorialAccess } from '@/access'
import { draftVersions, legacyFields, slugField } from '@/fields/common'
import { revalidateCollection } from '@/hooks/revalidate'

export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: 'Tài liệu', plural: 'Tài liệu tải về' },
  access: editorialAccess,
  admin: {
    useAsTitle: 'title',
    group: 'Thư viện',
    defaultColumns: ['title', 'group', 'updatedAt'],
  },
  defaultPopulate: { title: true, file: true, group: true },
  versions: draftVersions,
  fields: [
    { name: 'title', type: 'text', label: 'Tên tài liệu', required: true, localized: true },
    { name: 'file', type: 'upload', relationTo: 'media', label: 'Tệp (PDF)', required: true },
    {
      name: 'group',
      type: 'select',
      label: 'Nhóm',
      defaultValue: 'admissions',
      options: [
        { label: 'Tuyển sinh', value: 'admissions' },
        { label: 'Sinh viên', value: 'students' },
        { label: 'Biểu mẫu', value: 'forms' },
        { label: 'Khác', value: 'other' },
      ],
    },
    slugField(),
    ...legacyFields,
  ],
  hooks: revalidateCollection('documents'),
}
