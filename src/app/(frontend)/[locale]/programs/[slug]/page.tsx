import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { FaqAccordion } from '@/components/blocks/faq-list'
import { Card, CardGrid } from '@/components/card'
import { JsonLd } from '@/components/json-ld'
import { LeadFormSection } from '@/components/lead-form-section'
import { MediaImage } from '@/components/media-image'
import { PageHeader } from '@/components/page-header'
import { RichText } from '@/components/rich-text'
import { Badge, ButtonLink, Section, SectionHeading } from '@/components/ui'
import { getDictionary } from '@/lib/i18n/dictionary'
import { sectionHref } from '@/lib/i18n/routes'
import { assertLocale, docAlternates, siteName, type SlugParams } from '@/lib/page-helpers'
import { getProgram, getSiteSettings } from '@/lib/queries'
import { courseJsonLd, faqPageJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { absoluteUrl, getSiteUrl } from '@/lib/site'
import { formatMoney, isTuitionExpired, sortTuition } from '@/lib/tuition'
import type { Campus, Faq, Major } from '@/payload-types'

export const revalidate = 3600

export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: SlugParams }): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = assertLocale(raw)
  const program = await getProgram(locale, decodeURIComponent(slug))
  if (!program) return {}
  const [settings, name, alternates] = await Promise.all([
    getSiteSettings(locale),
    siteName(locale),
    docAlternates('programs', program.id),
  ])
  return buildMetadata({
    locale,
    title: program.title,
    description: program.summary,
    path: sectionHref(locale, 'programs', program.slug),
    alternates,
    meta: program.meta,
    image: program.heroImage,
    fallbackImage: settings.defaultOgImage,
    siteName: name,
  })
}

export default async function ProgramPage({ params }: { params: SlugParams }) {
  const { locale: raw, slug } = await params
  const locale = assertLocale(raw)
  const t = getDictionary(locale)
  const program = await getProgram(locale, decodeURIComponent(slug))
  if (!program) notFound()

  const name = await siteName(locale)
  const majors = (program.majors?.docs ?? []).filter(
    (m): m is Major => typeof m === 'object' && m !== null && Boolean(m.slug),
  )
  const campuses = (program.campuses ?? []).filter(
    (c): c is Campus => typeof c === 'object' && c !== null,
  )
  const faqs = (program.faqs ?? []).filter(
    (f): f is Faq => typeof f === 'object' && f !== null && Boolean(f.question),
  )
  const tuition = sortTuition(program.tuitionByYear ?? [])
  const url = absoluteUrl(sectionHref(locale, 'programs', program.slug))

  return (
    <>
      <PageHeader
        locale={locale}
        title={program.title}
        intro={program.summary}
        breadcrumb={[
          { label: t.programs, href: sectionHref(locale, 'programs') },
          { label: program.title },
        ]}
        meta={
          <>
            <Badge tone="brand">{program.level === 'master' ? t.master : t.bachelor}</Badge>
            {program.duration ? (
              <span>
                {t.duration}: {program.duration}
              </span>
            ) : null}
          </>
        }
      >
        <div className="mt-6">
          <ButtonLink href="#dang-ky" data-lead-dialog="">
            {t.register}
          </ButtonLink>
        </div>
      </PageHeader>

      {program.heroImage ? (
        <div className="container-site pt-8">
          <MediaImage
            media={program.heroImage}
            prefer="hero"
            priority
            sizes="(min-width: 1280px) 1280px, 100vw"
            className="aspect-[12/5] w-full rounded-(--radius-card)"
          />
        </div>
      ) : null}

      {program.body ? (
        <Section>
          <RichText data={program.body} locale={locale} className="max-w-3xl" />
        </Section>
      ) : null}

      {majors.length ? (
        <Section tone="surface" labelledBy="majors-heading">
          <SectionHeading id="majors-heading" title={t.majors} />
          <CardGrid>
            {majors.map((m) => (
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
      ) : null}

      {tuition.length ? (
        <Section labelledBy="tuition-heading">
          <SectionHeading id="tuition-heading" title={t.tuition} />
          <div className="overflow-x-auto rounded-(--radius-card) border border-line">
            <table className="w-full min-w-[32rem] text-left">
              <caption className="sr-only">{t.tuition}</caption>
              <thead className="bg-surface">
                <tr>
                  <th scope="col" className="p-3">
                    {t.academicYear}
                  </th>
                  <th scope="col" className="p-3">
                    {t.amount}
                  </th>
                  <th scope="col" className="p-3">
                    {t.note}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tuition.map((row, i) => {
                  const expired = isTuitionExpired(row.academicYear)
                  return (
                    <tr
                      key={row.id ?? i}
                      className={
                        expired ? 'border-t border-line text-muted' : 'border-t border-line'
                      }
                    >
                      <th scope="row" className="p-3 font-semibold">
                        {row.academicYear}{' '}
                        {expired ? <Badge tone="warning">{t.expired}</Badge> : null}
                      </th>
                      <td className={expired ? 'p-3 line-through' : 'p-3 font-semibold'}>
                        {formatMoney(row.amount, row.currency ?? 'VND', locale)}
                      </td>
                      <td className="p-3">{row.note}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      {program.entryRequirements || program.transferPathway ? (
        <Section tone="surface">
          <div className="grid gap-10 lg:grid-cols-2">
            {program.entryRequirements ? (
              <div>
                <h2 className="mb-4 text-2xl font-bold">{t.entryRequirements}</h2>
                <RichText data={program.entryRequirements} locale={locale} />
              </div>
            ) : null}
            {program.transferPathway ? (
              <div>
                <h2 className="mb-4 text-2xl font-bold">{t.transferPathway}</h2>
                <RichText data={program.transferPathway} locale={locale} />
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      {campuses.length ? (
        <Section labelledBy="campus-heading">
          <SectionHeading id="campus-heading" title={t.studyAt} />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campuses.map((c) => (
              <li key={c.id} className="rounded-(--radius-card) border border-line p-5">
                <a
                  href={sectionHref(locale, 'campuses', c.slug)}
                  className="font-semibold hover:text-brand"
                >
                  {c.name}
                </a>
                <p className="mt-1 text-sm text-ink-soft">{c.address}</p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {faqs.length ? (
        <Section tone="surface" labelledBy="faq-heading">
          <div className="mx-auto max-w-3xl">
            <SectionHeading id="faq-heading" title={t.faqs} />
            <FaqAccordion faqs={faqs} locale={locale} />
          </div>
        </Section>
      ) : null}

      <LeadFormSection locale={locale} defaultProgram={program.title} />

      <JsonLd data={courseJsonLd({ program, url, locale, org: { name, url: getSiteUrl() } })} />
      <JsonLd data={faqPageJsonLd(faqs)} />
    </>
  )
}
