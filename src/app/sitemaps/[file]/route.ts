import { isLocale } from '@/lib/i18n/config'
import { getSitemapEntries, renderUrlset } from '@/lib/sitemap'

// Dữ liệu đã cache theo tag "sitemap" trong getSitemapEntries()
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const locale = file.replace(/\.xml$/, '')
  if (!file.endsWith('.xml') || !isLocale(locale)) return new Response('Not found', { status: 404 })
  const entries = await getSitemapEntries()
  return new Response(renderUrlset(entries[locale]), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
