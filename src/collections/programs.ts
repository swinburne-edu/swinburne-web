import type { CollectionConfig } from 'payload'

import { editorialAccess } from '@/access'
import { draftVersions, legacyFields, slugField } from '@/fields/common'
import { revalidateCollection } from '@/hooks/revalidate'

export const Programs: CollectionConfig = {
  slug: 'programs',
  labels: { singular: 'Chương trình', plural: 'Chương trình đào tạo' },
  access: editorialAccess,
  admin: {
    useAsTitle: 'title',
    group: 'Đào tạo',
    defaultColumns: ['title', 'level', 'duration', '_status', 'updatedAt'],
  },
  defaultPopulate: { title: true, slug: true, level: true, summary: true, heroImage: true },
  versions: draftVersions,
  fields: [
    { name: 'title', type: 'text', label: 'Tên chương trình', required: true, localized: true },
    {
      type: 'row',
      fields: [
        {
          name: 'level',
          type: 'select',
          label: 'Bậc học',
          required: true,
          options: [
            { label: 'Cử nhân (Bachelor)', value: 'bachelor' },
            { label: 'Thạc sĩ (Master)', value: 'master' },
          ],
        },
        {
          name: 'duration',
          type: 'text',
          label: 'Thời gian học',
          localized: true,
          admin: { description: 'Vd: 3 năm (toàn thời gian)' },
        },
      ],
    },
    { name: 'summary', type: 'textarea', label: 'Tóm tắt', localized: true },
    { name: 'heroImage', type: 'upload', relationTo: 'media', label: 'Ảnh đầu trang' },
    { name: 'body', type: 'richText', label: 'Giới thiệu chi tiết', localized: true },
    {
      name: 'campuses',
      type: 'relationship',
      relationTo: 'campuses',
      hasMany: true,
      label: 'Cơ sở đào tạo',
    },
    {
      name: 'tuitionByYear',
      type: 'array',
      label: 'Học phí theo năm học',
      admin: {
        description:
          'Mỗi dòng một năm học (vd 2026-2027). Năm học đã qua tự hiện nhãn "đã hết hiệu lực".',
        initCollapsed: false,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'academicYear',
              type: 'text',
              label: 'Năm học',
              required: true,
              validate: (value: unknown) =>
                typeof value === 'string' && /^\d{4}-\d{4}$/.test(value)
                  ? true
                  : 'Định dạng YYYY-YYYY, vd 2026-2027',
            },
            { name: 'amount', type: 'number', label: 'Mức phí', required: true, min: 0 },
            {
              name: 'currency',
              type: 'select',
              label: 'Tiền tệ',
              defaultValue: 'VND',
              options: ['VND', 'USD', 'AUD'],
            },
          ],
        },
        { name: 'note', type: 'text', label: 'Ghi chú', localized: true },
      ],
    },
    { name: 'entryRequirements', type: 'richText', label: 'Điều kiện đầu vào', localized: true },
    { name: 'transferPathway', type: 'richText', label: 'Lộ trình chuyển tiếp', localized: true },
    {
      name: 'majors',
      type: 'join',
      collection: 'majors',
      on: 'program',
      label: 'Các ngành',
      admin: { defaultColumns: ['title', '_status'] },
    },
    {
      name: 'faqs',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
      label: 'Câu hỏi thường gặp',
    },
    { name: 'sortOrder', type: 'number', label: 'Thứ tự hiển thị', admin: { position: 'sidebar' } },
    slugField(),
    ...legacyFields,
  ],
  hooks: revalidateCollection('programs'),
}
