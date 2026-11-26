import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { formatDate } from '@/components/format'
import { PageHeader } from '@/components/page-header'
import { RichText } from '@/components/rich-text'
import { Badge, ButtonLink, Container } from '@/components/ui'
import { getDictionary, researchTypeLabel } from '@/lib/i18n/dictionary'
import { sectionHref } from '@/lib/i18n/routes'
import { assertLocale, docAlternates, siteName, type SlugParams } from '@/lib/page-helpers'
import { getResearchItem, getSiteSettings } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo/metadata'

export const revalidate = 3600

export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: SlugParams }): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = assertLocale(raw)
  const item = await getResearchItem(locale, decodeURIComponent(slug))
  if (!item) return {}
  const [settings, name, alternates] = await Promise.all([
    getSiteSettings(locale),
    siteName(locale),
    docAlternates('research', item.id),
  ])
  return buildMetadata({
    locale,
    title: item.title,
    description: item.authors,
    path: sectionHref(locale, 'research', item.slug),
    alternates,
    meta: item.meta,
    fallbackImage: settings.defaultOgImage,
    type: 'article',
    publishedTime: item.publishedAt,
    siteName: name,
  })
}

export default async function ResearchItemPage({ params }: { params: SlugParams }) {
  const { locale: raw, slug } = await params
  const locale = assertLocale(raw)
  const t = getDictionary(locale)
  const item = await getResearchItem(locale, decodeURIComponent(slug))
  if (!item) notFound()
  return (
    <article>
      <PageHeader
        locale={locale}
        title={item.title}
        breadcrumb={[
          { label: t.research, href: sectionHref(locale, 'research') },
          { label: item.title },
        ]}
        meta={
          <>
            <Badge tone="brand">{researchTypeLabel[locale][item.type]}</Badge>
            {item.publishedAt ? (
              <time dateTime={item.publishedAt}>{formatDate(item.publishedAt, locale)}</time>
            ) : null}
          </>
        }
        intro={item.authors ? `${t.authors}: ${item.authors}` : null}
      />
      <Container className="py-10 md:py-14">
        <div className="mx-auto max-w-3xl">
          <RichText data={item.content} locale={locale} />
          {item.link ? (
            <ButtonLink href={item.link} variant="secondary" className="mt-8">
              {t.externalLink} ↗
            </ButtonLink>
          ) : null}
        </div>
      </Container>
    </article>
  )
}
