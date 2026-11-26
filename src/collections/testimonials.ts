import type { CollectionConfig } from 'payload'

import { editorialAccess } from '@/access'
import { draftVersions, legacyFields, slugField } from '@/fields/common'
import { revalidateCollection } from '@/hooks/revalidate'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: { singular: 'Cảm nhận', plural: 'Cảm nhận sinh viên' },
  access: editorialAccess,
  admin: { useAsTitle: 'name', group: 'Nội dung', defaultColumns: ['name', 'role', 'program'] },
  defaultPopulate: { name: true, role: true, quote: true, photo: true, program: true },
  versions: draftVersions,
  fields: [
    { name: 'name', type: 'text', label: 'Họ tên', required: true },
    { name: 'role', type: 'text', label: 'Vai trò (vd: Cựu sinh viên khoá 2020)', localized: true },
    { name: 'program', type: 'relationship', relationTo: 'programs', label: 'Chương trình' },
    { name: 'quote', type: 'textarea', label: 'Cảm nhận', required: true, localized: true },
    { name: 'photo', type: 'upload', relationTo: 'media', label: 'Ảnh' },
    slugField('name', false),
    ...legacyFields,
  ],
  hooks: revalidateCollection('testimonials'),
}
