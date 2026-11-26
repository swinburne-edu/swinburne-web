import type { CollectionConfig } from 'payload'

import { editorialAccess } from '@/access'
import { pageBlocks } from '@/blocks/configs'
import { draftVersions, legacyFields, slugField } from '@/fields/common'
import { revalidateCollection } from '@/hooks/revalidate'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Trang', plural: 'Trang' },
  access: editorialAccess,
  admin: {
    useAsTitle: 'title',
    group: 'Nội dung',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    description: 'Trang chủ có slug "home". Kéo thả các khối để dựng trang.',
  },
  defaultPopulate: { title: true, slug: true },
  versions: draftVersions,
  fields: [
    { name: 'title', type: 'text', label: 'Tiêu đề trang', required: true, localized: true },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Bố cục (các khối)',
      blocks: pageBlocks,
      // Mỗi ngôn ngữ có bố cục riêng
      localized: true,
      admin: { initCollapsed: true },
    },
    slugField(),
    ...legacyFields,
  ],
  hooks: revalidateCollection('pages'),
}
