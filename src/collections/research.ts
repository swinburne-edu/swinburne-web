import type { CollectionConfig } from 'payload'

import { editorialAccess } from '@/access'
import { draftVersions, legacyFields, publishedAtField, slugField } from '@/fields/common'
import { revalidateCollection } from '@/hooks/revalidate'

export const Research: CollectionConfig = {
  slug: 'research',
  labels: { singular: 'Nghiên cứu', plural: 'Nghiên cứu' },
  access: editorialAccess,
  admin: {
    useAsTitle: 'title',
    group: 'Nghiên cứu & Doanh nghiệp',
    defaultColumns: ['title', 'type', 'publishedAt', '_status'],
  },
  defaultPopulate: { title: true, slug: true, type: true, authors: true, publishedAt: true },
  versions: draftVersions,
  fields: [
    { name: 'title', type: 'text', label: 'Tiêu đề', required: true, localized: true },
    {
      name: 'type',
      type: 'select',
      label: 'Loại',
      required: true,
      defaultValue: 'paper',
      options: [
        { label: 'Bài báo (paper)', value: 'paper' },
        { label: 'Hội thảo (conference)', value: 'conference' },
        { label: 'Phòng lab (lab)', value: 'lab' },
        { label: 'Dự án (project)', value: 'project' },
      ],
    },
    { name: 'authors', type: 'text', label: 'Tác giả' },
    { name: 'link', type: 'text', label: 'Liên kết ngoài (DOI, trang hội thảo…)' },
    { name: 'content', type: 'richText', label: 'Nội dung', localized: true },
    publishedAtField('Ngày công bố'),
    slugField(),
    ...legacyFields,
  ],
  hooks: revalidateCollection('research'),
}
