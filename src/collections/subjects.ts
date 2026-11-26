import type { CollectionConfig } from 'payload'

import { editorialAccess } from '@/access'
import { draftVersions, legacyFields, slugField } from '@/fields/common'
import { revalidateCollection } from '@/hooks/revalidate'

export const Subjects: CollectionConfig = {
  slug: 'subjects',
  labels: { singular: 'Môn học', plural: 'Môn học' },
  access: editorialAccess,
  admin: { useAsTitle: 'title', group: 'Đào tạo', defaultColumns: ['code', 'title', 'credits'] },
  defaultPopulate: { code: true, title: true, credits: true, slug: true },
  versions: draftVersions,
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'code', type: 'text', label: 'Mã môn', index: true },
        { name: 'credits', type: 'number', label: 'Số tín chỉ', min: 0 },
      ],
    },
    { name: 'title', type: 'text', label: 'Tên môn', required: true, localized: true },
    { name: 'description', type: 'richText', label: 'Mô tả', localized: true },
    slugField(),
    ...legacyFields,
  ],
  hooks: revalidateCollection('subjects', ['collection:majors']),
}
