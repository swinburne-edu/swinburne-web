import type { CollectionConfig } from 'payload'

import { editorialAccess } from '@/access'
import { draftVersions, legacyFields, slugField } from '@/fields/common'
import { revalidateCollection } from '@/hooks/revalidate'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Sự kiện', plural: 'Sự kiện' },
  access: editorialAccess,
  admin: {
    useAsTitle: 'title',
    group: 'Tin tức & Sự kiện',
    defaultColumns: ['title', 'startAt', 'campus', 'registrationOpen', '_status'],
  },
  defaultPopulate: {
    title: true,
    slug: true,
    startAt: true,
    endAt: true,
    location: true,
    featuredImage: true,
    registrationOpen: true,
  },
  versions: draftVersions,
  fields: [
    { name: 'title', type: 'text', label: 'Tên sự kiện', required: true, localized: true },
    {
      type: 'row',
      fields: [
        {
          name: 'startAt',
          type: 'date',
          label: 'Bắt đầu',
          required: true,
          index: true,
          admin: { date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd/MM/yyyy HH:mm' } },
        },
        {
          name: 'endAt',
          type: 'date',
          label: 'Kết thúc',
          admin: { date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd/MM/yyyy HH:mm' } },
          validate: (value: unknown, { siblingData }: { siblingData: Record<string, unknown> }) => {
            if (!value || !siblingData?.startAt) return true
            return new Date(value as string) >= new Date(siblingData.startAt as string)
              ? true
              : 'Thời gian kết thúc phải sau thời gian bắt đầu'
          },
        },
      ],
    },
    { name: 'location', type: 'text', label: 'Địa điểm', localized: true },
    { name: 'campus', type: 'relationship', relationTo: 'campuses', label: 'Cơ sở' },
    { name: 'featuredImage', type: 'upload', relationTo: 'media', label: 'Ảnh đại diện' },
    { name: 'content', type: 'richText', label: 'Nội dung', localized: true },
    {
      name: 'registrationOpen',
      type: 'checkbox',
      label: 'Đang mở đăng ký',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    slugField(),
    ...legacyFields,
  ],
  hooks: revalidateCollection('events'),
}
