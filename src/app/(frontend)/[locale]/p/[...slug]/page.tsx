import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Breadcrumb } from '@/components/breadcrumb'
import { RenderBlocks, heroTitleIndex } from '@/components/blocks/render-blocks'
import { Container } from '@/components/ui'
import type { Locale } from '@/lib/i18n/config'
import { HOME_SLUG, pageHref } from '@/lib/i18n/routes'
import { assertLocale, docAlternates, siteName } from '@/lib/page-helpers'
import { getPage, getSiteSettings } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo/metadata'

export const revalidate = 3600

type Params = Promise<{ locale: string; slug: string[] }>

export function generateStaticParams() {
  return []
}

async function load(params: Params): Promise<{ locale: Locale; slug: string }> {
  const { locale: raw, slug } = await params
  const locale = assertLocale(raw)
  // Slug trang không chứa "/" → đường dẫn nhiều cấp không tồn tại
  if (slug.length !== 1 || slug[0] === HOME_SLUG) notFound()
  return { locale, slug: decodeURIComponent(slug[0]!) }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await load(params)
  const page = await getPage(locale, slug)
  if (!page) return {}
  const [settings, name, alternates] = await Promise.all([
    getSiteSettings(locale),
    siteName(locale),
    docAlternates('pages', page.id),
  ])
  return buildMetadata({
    locale,
    title: page.title,
    path: pageHref(locale, page.slug),
    alternates,
    meta: page.meta,
    fallbackImage: settings.defaultOgImage,
    siteName: name,
  })
}

export default async function DynamicPage({ params }: { params: Params }) {
  const { locale, slug } = await load(params)
  const page = await getPage(locale, slug)
  if (!page) notFound()
  const blocks = page.layout ?? []
  const hasHeroTitle = heroTitleIndex(blocks) !== -1

  return (
    <>
      {!hasHeroTitle ? (
        <div className="border-b border-line bg-surface">
          <Container className="py-8 md:py-12">
            <Breadcrumb locale={locale} items={[{ label: page.title }]} />
            <h1 className="mt-4 text-3xl font-bold md:text-4xl">{page.title}</h1>
          </Container>
        </div>
      ) : null}
      <RenderBlocks blocks={blocks} locale={locale} />
    </>
  )
}
