import 'server-only'

import { unstable_cache } from 'next/cache'
import type { CollectionSlug } from 'payload'

import { cacheTags } from '@/lib/cache-tags'
import { locales, type Locale } from '@/lib/i18n/config'
import { archiveHref, docHref, homeHref, HOME_SLUG, sectionHref, sections } from '@/lib/i18n/routes'
import { getPayloadClient } from '@/lib/queries'
import { absoluteUrl } from '@/lib/site'

export type SitemapEntry = {
  loc: string
  lastmod?: string
  alternates?: Partial<Record<Locale, string>>
}

const COLLECTIONS: CollectionSlug[] = [
  'pages',
  'programs',
  'majors',
  'campuses',
  'news',
  'events',
  'research',
]

type DocAllLocales = {
  slug?: Partial<Record<Locale, string | null>> | null
  updatedAt?: string
  meta?: { noindex?: boolean | null } | null
}

/** Toàn bộ URL công khai, tách theo locale; kèm hreflang khi có đủ bản dịch. */
export const getSitemapEntries = unstable_cache(
  async (): Promise<Record<Locale, SitemapEntry[]>> => {
    const payload = await getPayloadClient()
    const out: Record<Locale, SitemapEntry[]> = { vi: [], en: [] }

    for (const locale of locales) {
      out[locale].push({
        loc: absoluteUrl(homeHref(locale)),
        alternates: { vi: absoluteUrl('/'), en: absoluteUrl('/en') },
      })
      for (const s of sections) {
        out[locale].push({
          loc: absoluteUrl(sectionHref(locale, s)),
          alternates: {
            vi: absoluteUrl(sectionHref('vi', s)),
            en: absoluteUrl(sectionHref('en', s)),
          },
        })
      }
      out[locale].push({ loc: absoluteUrl(archiveHref(locale)) })
    }

    for (const collection of COLLECTIONS) {
      const { docs } = await payload.find({
        collection,
        locale: 'all',
        pagination: false,
        limit: 0,
        depth: 0,
        overrideAccess: false,
        select: { slug: true, updatedAt: true, meta: true } as never,
      })
      for (const raw of docs as unknown as DocAllLocales[]) {
        if (raw.meta?.noindex) continue
        const slugs = raw.slug ?? {}
        const urls: Partial<Record<Locale, string>> = {}
        for (const locale of locales) {
          const slug = slugs[locale]
          if (slug && !(collection === 'pages' && slug === HOME_SLUG)) {
            urls[locale] = absoluteUrl(docHref(locale, collection, slug))
          }
        }
        const both = urls.vi && urls.en
        for (const locale of locales) {
          const loc = urls[locale]
          if (!loc) continue
          out[locale].push({ loc, lastmod: raw.updatedAt, alternates: both ? urls : undefined })
        }
      }
    }
    return out
  },
  ['sitemap-entries'],
  { tags: [cacheTags.sitemap], revalidate: 3600 },
)

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function renderUrlset(entries: SitemapEntry[]): string {
  const body = entries
    .map((e) => {
      const alts = e.alternates
        ? Object.entries(e.alternates)
            .map(
              ([l, href]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(href!)}"/>`,
            )
            .join('') +
          (e.alternates.vi
            ? `<xhtml:link rel="alternate" hreflang="x-default" href="${esc(e.alternates.vi)}"/>`
            : '')
        : ''
      const lastmod = e.lastmod ? `<lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : ''
      return `<url><loc>${esc(e.loc)}</loc>${lastmod}${alts}</url>`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>`
}

export function renderSitemapIndex(urls: string[]): string {
  const body = urls.map((u) => `<sitemap><loc>${esc(u)}</loc></sitemap>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`
}
