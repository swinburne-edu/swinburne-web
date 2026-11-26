import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { formatDate } from '@/components/format'
import { JsonLd } from '@/components/json-ld'
import { MediaImage } from '@/components/media-image'
import { newsListHref } from '@/components/news-list'
import { PageHeader } from '@/components/page-header'
import { RichText } from '@/components/rich-text'
import { Badge, ButtonLink, Container } from '@/components/ui'
import { isArchivedDate } from '@/lib/archive'
import { getDictionary } from '@/lib/i18n/dictionary'
import { archiveHref, sectionHref } from '@/lib/i18n/routes'
import { imageSource } from '@/lib/media'
import { assertLocale, docAlternates, siteName, type SlugParams } from '@/lib/page-helpers'
import { getNewsItem, getSiteSettings } from '@/lib/queries'
import { newsArticleJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { absoluteUrl, getSiteUrl } from '@/lib/site'
import type { Category } from '@/payload-types'

export const revalidate = 3600

export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: SlugParams }): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = assertLocale(raw)
  const news = await getNewsItem(locale, decodeURIComponent(slug))
  if (!news) return {}
  const [settings, name, alternates] = await Promise.all([
    getSiteSettings(locale),
    siteName(locale),
    docAlternates('news', news.id),
  ])
  return buildMetadata({
    locale,
    title: news.title,
    description: news.excerpt,
    path: sectionHref(locale, 'news', news.slug),
    alternates,
    meta: news.meta,
    image: news.featuredImage,
    fallbackImage: settings.defaultOgImage,
    type: 'article',
    publishedTime: news.publishedAt,
    modifiedTime: news.updatedAt,
    siteName: name,
  })
}

export default async function NewsItemPage({ params }: { params: SlugParams }) {
  const { locale: raw, slug } = await params
  const locale = assertLocale(raw)
  const t = getDictionary(locale)
  const news = await getNewsItem(locale, decodeURIComponent(slug))
  if (!news) notFound()

  const [settings, name] = await Promise.all([getSiteSettings(locale), siteName(locale)])
  const archived = isArchivedDate(news.publishedAt)
  const categories = (news.categories ?? []).filter(
    (c): c is Category => typeof c === 'object' && c !== null,
  )
  const img = imageSource(news.featuredImage, 'content')
  const logo = imageSource(settings.logo, 'original')

  return (
    <article>
      <PageHeader
        locale={locale}
        title={news.title}
        intro={news.excerpt}
        breadcrumb={[
          { label: t.news, href: sectionHref(locale, 'news') },
          ...(archived ? [{ label: t.archive, href: archiveHref(locale) }] : []),
          { label: news.title },
        ]}
        meta={
          <>
            <span>
              {t.publishedOn}{' '}
              <time dateTime={news.publishedAt ?? undefined}>
                {formatDate(news.publishedAt, locale)}
              </time>
            </span>
            {categories.map((c) => (
              <Link key={c.id} href={newsListHref(locale, { category: c.slug })}>
                <Badge>{c.title}</Badge>
              </Link>
            ))}
          </>
        }
      />
      <Container className="py-10 md:py-14">
        <div className="mx-auto max-w-3xl">
          {news.featuredImage ? (
            <MediaImage
              media={news.featuredImage}
              prefer="content"
              priority
              sizes="(min-width: 768px) 768px, 100vw"
              className="mb-8 w-full rounded-(--radius-card)"
            />
          ) : null}
          <RichText data={news.content} locale={locale} />
          <div className="mt-12 rounded-(--radius-card) bg-brand-light p-6">
            <p className="font-semibold">{t.formIntro}</p>
            <ButtonLink
              href={locale === 'vi' ? '/dang-ky-tu-van' : '/en/register'}
              data-lead-dialog=""
              className="mt-4"
            >
              {t.register}
            </ButtonLink>
          </div>
        </div>
      </Container>
      <JsonLd
        data={newsArticleJsonLd({
          news,
          url: absoluteUrl(sectionHref(locale, 'news', news.slug)),
          imageUrl: img ? absoluteUrl(img.src) : null,
          org: { name, url: getSiteUrl(), logoUrl: logo ? absoluteUrl(logo.src) : null },
        })}
      />
    </article>
  )
}
