import type { Metadata } from 'next'

import { defaultLocale, ogLocale, type Locale } from '@/lib/i18n/config'
import { imageSource } from '@/lib/media'
import { absoluteUrl, isNoindexEnv } from '@/lib/site'
import type { Media } from '@/payload-types'

export type Alternates = Partial<Record<Locale, string | null>>

export type SeoMeta =
  | {
      title?: string | null
      description?: string | null
      image?: number | Media | null
      noindex?: boolean | null
    }
  | null
  | undefined

export type BuildMetadataArgs = {
  locale: Locale
  /** Tiêu đề trang (không kèm tên site — layout tự thêm hậu tố) */
  title: string
  description?: string | null
  /** Đường dẫn công khai của trang ở locale hiện tại */
  path: string
  /** Đường dẫn của trang ở từng locale (null = chưa có bản dịch) */
  alternates?: Alternates
  /** Trường seo (meta) từ plugin-seo — ưu tiên hơn title/description/ảnh mặc định */
  meta?: SeoMeta
  image?: number | Media | null
  fallbackImage?: number | Media | null
  type?: 'website' | 'article'
  publishedTime?: string | null
  modifiedTime?: string | null
  siteName: string
}

function ogImage(media: number | Media | null | undefined) {
  const src = imageSource(media, 'content')
  if (!src) return null
  return { url: absoluteUrl(src.src), width: src.width, height: src.height, alt: src.alt }
}

/**
 * hreflang chỉ khi có đủ bản dịch (CLAUDE.md mục 9): cần cả vi và en.
 */
export function buildLanguageAlternates(
  alternates: Alternates | undefined,
): Record<string, string> | undefined {
  const vi = alternates?.vi
  const en = alternates?.en
  if (!vi || !en) return undefined
  return { vi: absoluteUrl(vi), en: absoluteUrl(en), 'x-default': absoluteUrl(vi) }
}

export function buildMetadata(args: BuildMetadataArgs): Metadata {
  const metaTitle = args.meta?.title?.trim()
  const description =
    (args.meta?.description || args.description || '').trim().slice(0, 300) || undefined
  const canonical = absoluteUrl(args.path)
  const image = ogImage(args.meta?.image) ?? ogImage(args.image) ?? ogImage(args.fallbackImage)
  const noindex = isNoindexEnv() || Boolean(args.meta?.noindex)
  const languages = buildLanguageAlternates(args.alternates)
  const otherLocale: Locale = args.locale === 'vi' ? 'en' : 'vi'

  return {
    title: metaTitle ? { absolute: metaTitle } : args.title,
    description,
    alternates: { canonical, ...(languages ? { languages } : {}) },
    openGraph: {
      type: args.type ?? 'website',
      title: metaTitle || args.title,
      description,
      url: canonical,
      siteName: args.siteName,
      locale: ogLocale[args.locale],
      ...(languages ? { alternateLocale: [ogLocale[otherLocale]] } : {}),
      ...(image ? { images: [image] } : {}),
      ...(args.type === 'article' && args.publishedTime
        ? { publishedTime: args.publishedTime, modifiedTime: args.modifiedTime ?? undefined }
        : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: metaTitle || args.title,
      description,
      ...(image ? { images: [image.url] } : {}),
    },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
  }
}

export { defaultLocale }
