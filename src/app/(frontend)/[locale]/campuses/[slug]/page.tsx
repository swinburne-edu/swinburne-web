import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/json-ld'
import { LeadFormSection } from '@/components/lead-form-section'
import { MediaImage } from '@/components/media-image'
import { PageHeader } from '@/components/page-header'
import { RichText } from '@/components/rich-text'
import { Section } from '@/components/ui'
import { getDictionary } from '@/lib/i18n/dictionary'
import { sectionHref } from '@/lib/i18n/routes'
import { assertLocale, docAlternates, siteName, type SlugParams } from '@/lib/page-helpers'
import { getCampus, getSiteSettings } from '@/lib/queries'
import { campusPlace } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { getSiteUrl } from '@/lib/site'

export const revalidate = 3600

export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: SlugParams }): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = assertLocale(raw)
  const campus = await getCampus(locale, decodeURIComponent(slug))
  if (!campus) return {}
  const [settings, name, alternates] = await Promise.all([
    getSiteSettings(locale),
    siteName(locale),
    docAlternates('campuses', campus.id),
  ])
  return buildMetadata({
    locale,
    title: campus.name,
    description: campus.address,
    path: sectionHref(locale, 'campuses', campus.slug),
    alternates,
    meta: campus.meta,
    image: Array.isArray(campus.images) ? campus.images[0] : null,
    fallbackImage: settings.defaultOgImage,
    siteName: name,
  })
}

export default async function CampusPage({ params }: { params: SlugParams }) {
  const { locale: raw, slug } = await params
  const locale = assertLocale(raw)
  const t = getDictionary(locale)
  const campus = await getCampus(locale, decodeURIComponent(slug))
  if (!campus) notFound()
  const images = Array.isArray(campus.images) ? campus.images : []
  const name = await siteName(locale)

  return (
    <>
      <PageHeader
        locale={locale}
        title={campus.name}
        breadcrumb={[
          { label: t.campuses, href: sectionHref(locale, 'campuses') },
          { label: campus.name },
        ]}
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-3">
          <dl className="space-y-4 rounded-(--radius-card) border border-line p-6 lg:col-span-1">
            <div>
              <dt className="text-sm font-semibold text-muted">{t.address}</dt>
              <dd className="mt-1">{campus.address}</dd>
            </div>
            {campus.phone ? (
              <div>
                <dt className="text-sm font-semibold text-muted">{t.phone}</dt>
                <dd className="mt-1">
                  <a
                    className="font-semibold text-brand hover:underline"
                    href={`tel:${campus.phone.replace(/\s/g, '')}`}
                  >
                    {campus.phone}
                  </a>
                </dd>
              </div>
            ) : null}
            {campus.email ? (
              <div>
                <dt className="text-sm font-semibold text-muted">{t.email}</dt>
                <dd className="mt-1">
                  <a className="hover:underline" href={`mailto:${campus.email}`}>
                    {campus.email}
                  </a>
                </dd>
              </div>
            ) : null}
            {campus.mapUrl ? (
              <div>
                <a
                  href={campus.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand hover:underline"
                >
                  {t.map} ↗
                </a>
              </div>
            ) : null}
          </dl>
          <div className="space-y-6 lg:col-span-2">
            {images[0] ? (
              <MediaImage
                media={images[0]}
                prefer="content"
                priority
                sizes="(min-width: 1024px) 66vw, 100vw"
                className="aspect-video w-full rounded-(--radius-card)"
              />
            ) : null}
            {campus.description ? <RichText data={campus.description} locale={locale} /> : null}
          </div>
        </div>
      </Section>
      <LeadFormSection locale={locale} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          ...campusPlace(campus),
          containedInPlace: { '@type': 'CollegeOrUniversity', name, url: getSiteUrl() },
        }}
      />
    </>
  )
}
