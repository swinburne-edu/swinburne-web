import { slugField as payloadSlugField, type Field, type RowField } from 'payload'

import { slugify } from '@/lib/slugify'

/** Slug: tự sinh từ tiêu đề (bỏ dấu tiếng Việt), unique theo locale. */
export function slugField(useAsSlug = 'title', localized = true): RowField {
  return payloadSlugField({
    useAsSlug,
    localized,
    position: 'sidebar',
    slugify: ({ valueToSlugify }) =>
      typeof valueToSlugify === 'string' ? slugify(valueToSlugify) : undefined,
    overrides: (field) => {
      for (const sub of field.fields) {
        if ('name' in sub && sub.name === 'slug') {
          sub.label = 'Đường dẫn (slug)'
          sub.admin = {
            ...sub.admin,
            description: 'Tự sinh từ tiêu đề. Đổi slug của bài đã đăng sẽ làm hỏng link cũ.',
          }
        }
      }
      return field
    },
  })
}

/** legacyId / legacyUrl: dành cho giai đoạn chuyển dữ liệu WordPress, ẩn trong admin. */
export const legacyFields: Field[] = [
  {
    name: 'legacyId',
    type: 'number',
    index: true,
    admin: { hidden: true },
  },
  {
    name: 'legacyUrl',
    type: 'text',
    index: true,
    admin: { hidden: true },
  },
]

export const publishedAtField = (label = 'Ngày đăng'): Field => ({
  name: 'publishedAt',
  type: 'date',
  label,
  index: true,
  admin: {
    position: 'sidebar',
    date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd/MM/yyyy HH:mm' },
  },
  hooks: {
    beforeChange: [
      ({ siblingData, value }) => {
        if (!value && siblingData?._status === 'published') return new Date().toISOString()
        return value
      },
    ],
  },
})

/** Cấu hình versions + drafts dùng chung cho nội dung biên tập */
export const draftVersions = {
  drafts: { autosave: false, schedulePublish: true },
  maxPerDoc: 30,
} as const
