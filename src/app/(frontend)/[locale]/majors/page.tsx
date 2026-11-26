import type { Metadata } from 'next'

import { Card, CardGrid } from '@/components/card'
import { PageHeader } from '@/components/page-header'
import { Section, SectionHeading } from '@/components/ui'
import { getDictionary } from '@/lib/i18n/dictionary'
import { sectionHref } from '@/lib/i18n/routes'
import { assertLocale, siteName, type LocaleParams } from '@/lib/page-helpers'
import { getMajors, getPrograms } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo/metadata'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = assertLocale((await params).locale)
  const t = getDictionary(locale)
  return buildMetadata({
    locale,
    title: t.majors,
    path: sectionHref(locale, 'majors'),
    alternates: { vi: sectionHref('vi', 'majors'), en: sectionHref('en', 'majors') },
    siteName: await siteName(locale),
  })
}

export default async function MajorsPage({ params }: { params: LocaleParams }) {
  const locale = assertLocale((await params).locale)
  const t = getDictionary(locale)
  const [programs, majors] = await Promise.all([getPrograms(locale), getMajors(locale)])
  return (
    <>
      <PageHeader locale={locale} title={t.majors} breadcrumb={[{ label: t.majors }]} />
      {programs.map((p, i) => {
        const items = majors.filter(
          (m) => (typeof m.program === 'object' ? m.program?.id : m.program) === p.id,
        )
        if (!items.length) return null
        return (
          <Section key={p.id} tone={i % 2 ? 'surface' : 'white'} labelledBy={`prog-${p.id}`}>
            <SectionHeading id={`prog-${p.id}`} title={p.title} />
            <CardGrid columns={4}>
              {items.map((m) => (
                <Card
                  key={m.id}
                  title={m.title}
                  text={m.summary}
                  image={m.heroImage}
                  href={sectionHref(locale, 'majors', m.slug)}
                />
              ))}
            </CardGrid>
          </Section>
        )
      })}
    </>
  )
}
