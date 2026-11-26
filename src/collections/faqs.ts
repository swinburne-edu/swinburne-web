import type { CollectionConfig } from 'payload'

import { editorialAccess } from '@/access'
import { draftVersions, legacyFields, slugField } from '@/fields/common'
import { revalidateCollection } from '@/hooks/revalidate'

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'Câu hỏi thường gặp', plural: 'Câu hỏi thường gặp (FAQ)' },
  access: editorialAccess,
  admin: { useAsTitle: 'question', group: 'Nội dung', defaultColumns: ['question', 'group'] },
  defaultPopulate: { question: true, answer: true, group: true },
  versions: draftVersions,
  fields: [
    { name: 'question', type: 'text', label: 'Câu hỏi', required: true, localized: true },
    { name: 'answer', type: 'richText', label: 'Trả lời', required: true, localized: true },
    {
      name: 'group',
      type: 'select',
      label: 'Nhóm',
      defaultValue: 'admissions',
      options: [
        { label: 'Tuyển sinh', value: 'admissions' },
        { label: 'Học phí & học bổng', value: 'tuition' },
        { label: 'Chương trình học', value: 'programs' },
        { label: 'Đời sống sinh viên', value: 'student-life' },
        { label: 'Khác', value: 'other' },
      ],
    },
    {
      name: 'programs',
      type: 'relationship',
      relationTo: 'programs',
      hasMany: true,
      label: 'Chương trình liên quan',
    },
    { name: 'sortOrder', type: 'number', label: 'Thứ tự hiển thị', admin: { position: 'sidebar' } },
    slugField('question'),
    ...legacyFields,
  ],
  hooks: revalidateCollection('faqs', ['collection:programs', 'collection:pages']),
}
