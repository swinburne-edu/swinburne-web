import 'server-only'

import { notFound } from 'next/navigation'
import type { CollectionSlug } from 'payload'

import { isLocale, type Locale } from '@/lib/i18n/config'
import { docHref } from '@/lib/i18n/routes'
import { getLocalizedSlugs, getSiteSettings } from '@/lib/queries'
import type { Alternates } from '@/lib/seo/metadata'

export type LocaleParams = Promise<{ locale: string }>
export type SlugParams = Promise<{ locale: string; slug: string }>

export function assertLocale(value: string): Locale {
  if (!isLocale(value)) notFound()
  return value
}

/** Đường dẫn của tài liệu ở cả 2 ngôn ngữ (null nếu chưa dịch) — cho hreflang + nút đổi ngôn ngữ */
export async function docAlternates(collection: CollectionSlug, id: number): Promise<Alternates> {
  const slugs = await getLocalizedSlugs(collection, id)
  return {
    vi: slugs.vi ? docHref('vi', collection, slugs.vi) : null,
    en: slugs.en ? docHref('en', collection, slugs.en) : null,
  }
}

export async function siteName(locale: Locale): Promise<string> {
  const s = await getSiteSettings(locale)
  return s.siteName || (locale === 'vi' ? 'Swinburne Việt Nam' : 'Swinburne Vietnam')
}

export function parsePageParam(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value)
  return Number.isInteger(n) && n > 0 && n < 10_000 ? n : 1
}

/** Một ngôn ngữ có dữ liệu được hay không theo cặp slug (trang list luôn có đủ 2 ngôn ngữ) */
export const listAlternates = (vi: string, en: string): Alternates => ({ vi, en })
