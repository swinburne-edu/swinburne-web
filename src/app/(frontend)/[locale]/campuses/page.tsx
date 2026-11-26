import type { Metadata } from 'next'

import { Card, CardGrid } from '@/components/card'
import { PageHeader } from '@/components/page-header'
import { Section } from '@/components/ui'
import { getDictionary } from '@/lib/i18n/dictionary'
import { sectionHref } from '@/lib/i18n/routes'
import { assertLocale, siteName, type LocaleParams } from '@/lib/page-helpers'
import { getCampuses } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo/metadata'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = assertLocale((await params).locale)
  const t = getDictionary(locale)
  return buildMetadata({
    locale,
    title: t.campuses,
    path: sectionHref(locale, 'campuses'),
    alternates: { vi: sectionHref('vi', 'campuses'), en: sectionHref('en', 'campuses') },
    siteName: await siteName(locale),
  })
}

export default async function CampusesPage({ params }: { params: LocaleParams }) {
  const locale = assertLocale((await params).locale)
  const t = getDictionary(locale)
  const campuses = await getCampuses(locale)
  return (
    <>
      <PageHeader locale={locale} title={t.campuses} breadcrumb={[{ label: t.campuses }]} />
      <Section>
        <CardGrid>
          {campuses.map((c) => (
            <Card
              key={c.id}
              title={c.name}
              text={c.address}
              meta={c.phone ? `${t.phone}: ${c.phone}` : undefined}
              image={Array.isArray(c.images) ? c.images[0] : null}
              href={sectionHref(locale, 'campuses', c.slug)}
              headingLevel="h2"
            />
          ))}
        </CardGrid>
      </Section>
    </>
  )
}
