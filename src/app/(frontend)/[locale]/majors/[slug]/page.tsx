import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { LeadFormSection } from '@/components/lead-form-section'
import { MediaImage } from '@/components/media-image'
import { PageHeader } from '@/components/page-header'
import { RichText } from '@/components/rich-text'
import { Section, SectionHeading } from '@/components/ui'
import { getDictionary } from '@/lib/i18n/dictionary'
import { sectionHref } from '@/lib/i18n/routes'
import { assertLocale, docAlternates, siteName, type SlugParams } from '@/lib/page-helpers'
import { getMajor, getSiteSettings } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo/metadata'
import type { Program, Subject } from '@/payload-types'

export const revalidate = 3600

export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: SlugParams }): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = assertLocale(raw)
  const major = await getMajor(locale, decodeURIComponent(slug))
  if (!major) return {}
  const [settings, name, alternates] = await Promise.all([
    getSiteSettings(locale),
    siteName(locale),
    docAlternates('majors', major.id),
  ])
  return buildMetadata({
    locale,
    title: major.title,
    description: major.summary,
    path: sectionHref(locale, 'majors', major.slug),
    alternates,
    meta: major.meta,
    image: major.heroImage,
    fallbackImage: settings.defaultOgImage,
    siteName: name,
  })
}

export default async function MajorPage({ params }: { params: SlugParams }) {
  const { locale: raw, slug } = await params
  const locale = assertLocale(raw)
  const t = getDictionary(locale)
  const major = await getMajor(locale, decodeURIComponent(slug))
  if (!major) notFound()

  const program = typeof major.program === 'object' ? (major.program as Program) : null
  const subjects = (major.subjects ?? []).filter(
    (s): s is Subject => typeof s === 'object' && s !== null && Boolean(s.title),
  )
  const careers = major.careers ?? []

  return (
    <>
      <PageHeader
        locale={locale}
        title={major.title}
        intro={major.summary}
        breadcrumb={[
          { label: t.programs, href: sectionHref(locale, 'programs') },
          ...(program?.slug
            ? [{ label: program.title, href: sectionHref(locale, 'programs', program.slug) }]
            : []),
          { label: major.title },
        ]}
      />
      {major.heroImage ? (
        <div className="container-site pt-8">
          <MediaImage
            media={major.heroImage}
            prefer="hero"
            priority
            sizes="(min-width: 1280px) 1280px, 100vw"
            className="aspect-[12/5] w-full rounded-(--radius-card)"
          />
        </div>
      ) : null}
      {major.body ? (
        <Section>
          <RichText data={major.body} locale={locale} className="max-w-3xl" />
        </Section>
      ) : null}
      {careers.length ? (
        <Section tone="surface" labelledBy="careers">
          <SectionHeading id="careers" title={t.careers} />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {careers.map((c, i) => (
              <li
                key={c.id ?? i}
                className="rounded-md border-l-4 border-brand bg-white p-4 font-medium shadow-sm"
              >
                {c.title}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      {subjects.length ? (
        <Section labelledBy="subjects">
          <SectionHeading id="subjects" title={t.subjects} />
          <div className="overflow-x-auto rounded-(--radius-card) border border-line">
            <table className="w-full min-w-[28rem] text-left">
              <caption className="sr-only">{t.subjects}</caption>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id} className="border-b border-line last:border-0">
                    <th scope="row" className="w-32 p-3 font-mono text-sm">
                      {s.code}
                    </th>
                    <td className="p-3">{s.title}</td>
                    <td className="p-3 text-right text-sm text-muted">
                      {s.credits ? `${s.credits} ${t.credits}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}
      <LeadFormSection
        locale={locale}
        defaultProgram={program ? `${program.title} — ${major.title}` : undefined}
      />
    </>
  )
}
