import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { formatDateTime } from '@/components/format'
import { JsonLd } from '@/components/json-ld'
import { LeadFormSection } from '@/components/lead-form-section'
import { MediaImage } from '@/components/media-image'
import { PageHeader } from '@/components/page-header'
import { RichText } from '@/components/rich-text'
import { Badge, Container } from '@/components/ui'
import { getDictionary } from '@/lib/i18n/dictionary'
import { sectionHref } from '@/lib/i18n/routes'
import { imageSource } from '@/lib/media'
import { assertLocale, docAlternates, siteName, type SlugParams } from '@/lib/page-helpers'
import { getEvent, getSiteSettings } from '@/lib/queries'
import { eventJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { absoluteUrl, getSiteUrl } from '@/lib/site'
import type { Campus } from '@/payload-types'

export const revalidate = 3600

export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: SlugParams }): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = assertLocale(raw)
  const event = await getEvent(locale, decodeURIComponent(slug))
  if (!event) return {}
  const [settings, name, alternates] = await Promise.all([
    getSiteSettings(locale),
    siteName(locale),
    docAlternates('events', event.id),
  ])
  return buildMetadata({
    locale,
    title: event.title,
    description: event.location,
    path: sectionHref(locale, 'events', event.slug),
    alternates,
    meta: event.meta,
    image: event.featuredImage,
    fallbackImage: settings.defaultOgImage,
    siteName: name,
  })
}

export default async function EventPage({ params }: { params: SlugParams }) {
  const { locale: raw, slug } = await params
  const locale = assertLocale(raw)
  const t = getDictionary(locale)
  const event = await getEvent(locale, decodeURIComponent(slug))
  if (!event) notFound()
  const name = await siteName(locale)
  const campus = typeof event.campus === 'object' ? (event.campus as Campus | null) : null
  const img = imageSource(event.featuredImage, 'content')

  return (
    <>
      <PageHeader
        locale={locale}
        title={event.title}
        breadcrumb={[
          { label: t.events, href: sectionHref(locale, 'events') },
          { label: event.title },
        ]}
        meta={
          event.registrationOpen ? <Badge tone="success">{t.registrationOpen}</Badge> : undefined
        }
      >
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
          <div>
            <dt className="text-sm font-semibold text-muted">{t.time}</dt>
            <dd className="mt-1 font-semibold">
              <time dateTime={event.startAt}>{formatDateTime(event.startAt, locale)}</time>
              {event.endAt ? (
                <>
                  {' – '}
                  <time dateTime={event.endAt}>{formatDateTime(event.endAt, locale)}</time>
                </>
              ) : null}
            </dd>
          </div>
          {event.location || campus ? (
            <div>
              <dt className="text-sm font-semibold text-muted">{t.location}</dt>
              <dd className="mt-1 font-semibold">
                {event.location}
                {campus ? (
                  <span className="block text-sm font-normal text-ink-soft">{campus.address}</span>
                ) : null}
              </dd>
            </div>
          ) : null}
        </dl>
      </PageHeader>
      <Container className="py-10 md:py-14">
        <div className="mx-auto max-w-3xl">
          {event.featuredImage ? (
            <MediaImage
              media={event.featuredImage}
              prefer="content"
              priority
              sizes="(min-width: 768px) 768px, 100vw"
              className="mb-8 w-full rounded-(--radius-card)"
            />
          ) : null}
          <RichText data={event.content} locale={locale} />
        </div>
      </Container>
      {event.registrationOpen ? <LeadFormSection locale={locale} /> : null}
      <JsonLd
        data={eventJsonLd({
          event,
          url: absoluteUrl(sectionHref(locale, 'events', event.slug)),
          imageUrl: img ? absoluteUrl(img.src) : null,
          org: { name, url: getSiteUrl() },
        })}
      />
    </>
  )
}
