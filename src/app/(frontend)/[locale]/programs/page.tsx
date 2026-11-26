import type { Metadata } from 'next'

import { Card, CardGrid } from '@/components/card'
import { PageHeader } from '@/components/page-header'
import { Badge, Section } from '@/components/ui'
import { getDictionary } from '@/lib/i18n/dictionary'
import { sectionHref } from '@/lib/i18n/routes'
import { assertLocale, siteName, type LocaleParams } from '@/lib/page-helpers'
import { getPrograms } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo/metadata'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = assertLocale((await params).locale)
  const t = getDictionary(locale)
  return buildMetadata({
    locale,
    title: t.programs,
    path: sectionHref(locale, 'programs'),
    alternates: { vi: sectionHref('vi', 'programs'), en: sectionHref('en', 'programs') },
    siteName: await siteName(locale),
  })
}

export default async function ProgramsPage({ params }: { params: LocaleParams }) {
  const locale = assertLocale((await params).locale)
  const t = getDictionary(locale)
  const programs = await getPrograms(locale)
  return (
    <>
      <PageHeader locale={locale} title={t.programs} breadcrumb={[{ label: t.programs }]} />
      <Section>
        {programs.length ? (
          <CardGrid>
            {programs.map((p) => (
              <Card
                key={p.id}
                title={p.title}
                text={p.summary}
                image={p.heroImage}
                href={sectionHref(locale, 'programs', p.slug)}
                badge={<Badge tone="brand">{p.level === 'master' ? t.master : t.bachelor}</Badge>}
                meta={p.duration}
                headingLevel="h2"
              />
            ))}
          </CardGrid>
        ) : (
          <p className="text-muted">{t.noItems}</p>
        )}
      </Section>
    </>
  )
}
