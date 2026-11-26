import { locales } from '@/lib/i18n/config'
import { absoluteUrl } from '@/lib/site'
import { renderSitemapIndex } from '@/lib/sitemap'

export const revalidate = 3600

/** Sitemap index → mỗi ngôn ngữ một sitemap (CLAUDE.md mục 9). */
export function GET() {
  const xml = renderSitemapIndex(locales.map((l) => absoluteUrl(`/sitemaps/${l}.xml`)))
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
