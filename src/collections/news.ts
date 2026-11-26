import type { CollectionConfig } from 'payload'

import { editorialAccess } from '@/access'
import { draftVersions, legacyFields, publishedAtField, slugField } from '@/fields/common'
import { revalidateCollection } from '@/hooks/revalidate'
import { isArchivedDate } from '@/lib/archive'

export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'Tin tức', plural: 'Tin tức' },
  access: editorialAccess,
  admin: {
    useAsTitle: 'title',
    group: 'Tin tức & Sự kiện',
    defaultColumns: ['title', 'categories', 'publishedAt', '_status'],
    listSearchableFields: ['title', 'excerpt'],
  },
  defaultPopulate: {
    title: true,
    slug: true,
    excerpt: true,
    featuredImage: true,
    publishedAt: true,
    categories: true,
  },
  versions: draftVersions,
  fields: [
    { name: 'title', type: 'text', label: 'Tiêu đề', required: true, localized: true },
    { name: 'excerpt', type: 'textarea', label: 'Tóm tắt', localized: true, maxLength: 400 },
    { name: 'featuredImage', type: 'upload', relationTo: 'media', label: 'Ảnh đại diện' },
    { name: 'content', type: 'richText', label: 'Nội dung', localized: true },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      label: 'Chuyên mục',
      admin: { position: 'sidebar' },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      label: 'Thẻ',
      admin: { position: 'sidebar' },
    },
    {
      name: 'campus',
      type: 'relationship',
      relationTo: 'campuses',
      label: 'Cơ sở (tuỳ chọn)',
      admin: { position: 'sidebar' },
    },
    publishedAtField(),
    {
      name: 'isArchived',
      type: 'checkbox',
      label: 'Đã vào Lưu trữ (> 18 tháng)',
      virtual: true,
      admin: { readOnly: true, position: 'sidebar', description: 'Tự tính theo ngày đăng.' },
      hooks: {
        afterRead: [
          ({ siblingData }) => isArchivedDate(siblingData?.publishedAt as string | undefined),
        ],
      },
    },
    slugField(),
    ...legacyFields,
  ],
  hooks: revalidateCollection('news'),
}
