import type {
  DefaultNodeTypes,
  SerializedLinkNode,
  SerializedUploadNode,
} from '@payloadcms/richtext-lexical'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import {
  LinkJSXConverter,
  RichText as LexicalRichText,
  type JSXConvertersFunction,
} from '@payloadcms/richtext-lexical/react'
import clsx from 'clsx'

import type { Locale } from '@/lib/i18n/config'
import { docHref } from '@/lib/i18n/routes'
import { isMedia } from '@/lib/media'

import { MediaImage } from './media-image'

type Props = {
  data: unknown
  locale: Locale
  className?: string
}

function isEditorState(value: unknown): value is SerializedEditorState {
  return typeof value === 'object' && value !== null && 'root' in value
}

function makeConverters(locale: Locale): JSXConvertersFunction<DefaultNodeTypes> {
  const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
    const doc = linkNode.fields.doc
    const value = doc?.value
    if (!doc || typeof value !== 'object' || value === null) return '#'
    const slug = (value as { slug?: string }).slug
    return slug ? docHref(locale, doc.relationTo, slug) : '#'
  }

  return ({ defaultConverters }) => ({
    ...defaultConverters,
    ...LinkJSXConverter({ internalDocToHref }),
    // Nội dung bài không được có h1 (trang đã có đúng một h1) → hạ h1 thành h2
    heading: ({ node, nodesToJSX }) => {
      const children = nodesToJSX({ nodes: node.children })
      const tag = node.tag === 'h1' ? 'h2' : node.tag
      const Tag = (['h2', 'h3', 'h4', 'h5', 'h6'].includes(tag) ? tag : 'h2') as 'h2'
      return <Tag>{children}</Tag>
    },
    upload: ({ node }: { node: SerializedUploadNode }) => {
      const value = node.value
      if (!isMedia(value)) return null
      if (!value.mimeType?.startsWith('image/')) {
        return (
          <a
            href={`/media/${encodeURIComponent(value.filename ?? '')}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {value.alt || value.filename}
          </a>
        )
      }
      return (
        <figure>
          <MediaImage media={value} prefer="content" sizes="(min-width: 768px) 768px, 100vw" />
          {value.caption ? <figcaption>{value.caption}</figcaption> : null}
        </figure>
      )
    },
  })
}

export function RichText({ data, locale, className }: Props) {
  if (!isEditorState(data)) return null
  return (
    <LexicalRichText
      data={data}
      converters={makeConverters(locale)}
      disableContainer={false}
      className={clsx('prose-site', className)}
    />
  )
}
