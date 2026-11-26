import type { Metadata } from 'next'

import { RenderBlocks, heroTitleIndex } from '@/components/blocks/render-blocks'
import { JsonLd } from '@/components/json-ld'
import { homeHref, HOME_SLUG } from '@/lib/i18n/routes'
import { assertLocale, siteName, type LocaleParams } from '@/lib/page-helpers'
import { getCampuses, getFooter, getPage, getSiteSettings } from '@/lib/queries'
import { organizationJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { imageSource } from '@/lib/media'
import { absoluteUrl, getSiteUrl } from '@/lib/site'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = assertLocale((await params).locale)
  const [page, settings, name] = await Promise.all([
    getPage(locale, HOME_SLUG),
    getSiteSettings(locale),
    siteName(locale),
  ])
  const meta = buildMetadata({
    locale,
    title: name,
    description: settings.organizationDescription ?? settings.tagline,
    path: homeHref(locale),
    alternates: { vi: homeHref('vi'), en: homeHref('en') },
    meta: page?.meta,
    fallbackImage: settings.defaultOgImage,
    siteName: name,
  })
  return {
    ...meta,
    title: page?.meta?.title
      ? meta.title
      : { absolute: settings.tagline ? `${name} — ${settings.tagline}` : name },
  }
}

export default async function HomePage({ params }: { params: LocaleParams }) {
  const locale = assertLocale((await params).locale)
  const [page, settings, campuses, footer, name] = await Promise.all([
    getPage(locale, HOME_SLUG),
    getSiteSettings(locale),
    getCampuses(locale),
    getFooter(locale),
    siteName(locale),
  ])
  const blocks = page?.layout ?? []
  const logo = imageSource(settings.logo, 'original')

  const orgLd = organizationJsonLd(
    {
      name,
      url: getSiteUrl(),
      description: settings.organizationDescription,
      logoUrl: logo ? absoluteUrl(logo.src) : null,
      email: settings.generalEmail,
      sameAs: (footer.social ?? []).map((s) => s.url),
    },
    campuses,
  )

  return (
    <>
      {heroTitleIndex(blocks) === -1 ? <h1 className="sr-only">{name}</h1> : null}
      <RenderBlocks blocks={blocks} locale={locale} />
      <JsonLd data={orgLd} />
    </>
  )
}
