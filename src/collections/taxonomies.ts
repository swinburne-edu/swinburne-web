import type { CollectionConfig } from 'payload'

import { publicReadEditorWrite } from '@/access'
import { legacyFields, slugField } from '@/fields/common'
import { revalidateCollection } from '@/hooks/revalidate'

function taxonomy(slug: 'categories' | 'tags', singular: string, plural: string): CollectionConfig {
  return {
    slug,
    labels: { singular, plural },
    access: publicReadEditorWrite,
    admin: { useAsTitle: 'title', group: 'Tin tức & Sự kiện', defaultColumns: ['title', 'slug'] },
    versions: { maxPerDoc: 10 },
    fields: [
      { name: 'title', type: 'text', label: 'Tên', required: true, localized: true },
      slugField(),
      ...legacyFields,
    ],
    hooks: revalidateCollection(slug, ['collection:news']),
  }
}

export const Categories = taxonomy('categories', 'Chuyên mục', 'Chuyên mục')
export const Tags = taxonomy('tags', 'Thẻ', 'Thẻ')
