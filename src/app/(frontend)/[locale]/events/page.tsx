import type { Metadata } from 'next'

import { Card, CardGrid } from '@/components/card'
import { formatDateTime } from '@/components/format'
import { PageHeader } from '@/components/page-header'
import { Pagination } from '@/components/pagination'
import { Badge, Section, SectionHeading } from '@/components/ui'
import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionary'
import { sectionHref } from '@/lib/i18n/routes'
import { assertLocale, parsePageParam, siteName, type LocaleParams } from '@/lib/page-helpers'
import { getEventsPage, todayKey } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo/metadata'
import type { Event } from '@/payload-types'

// Dùng searchParams (phân trang) → render theo request; dữ liệu vẫn cache theo tag
export const dynamic = 'force-dynamic'

type Search = Promise<{ page?: string }>

const pastHref = (locale: Locale, page: number) =>
  page > 1
    ? `${sectionHref(locale, 'events')}?page=${page}#past`
    : `${sectionHref(locale, 'events')}#past`

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = assertLocale((await params).locale)
  const t = getDictionary(locale)
  return buildMetadata({
    locale,
    title: t.events,
    path: sectionHref(locale, 'events'),
    alternates: { vi: sectionHref('vi', 'events'), en: sectionHref('en', 'events') },
    siteName: await siteName(locale),
  })
}

function EventCard({ event, locale }: { event: Event; locale: Locale }) {
  const t = getDictionary(locale)
  return (
    <Card
      title={event.title}
      image={event.featuredImage}
      href={sectionHref(locale, 'events', event.slug)}
      meta={
        <>
          <time dateTime={event.startAt}>{formatDateTime(event.startAt, locale)}</time>
          {event.location ? ` · ${event.location}` : ''}
        </>
      }
      badge={
        event.registrationOpen ? <Badge tone="success">{t.registrationOpen}</Badge> : undefined
      }
    />
  )
}

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: LocaleParams
  searchParams: Search
}) {
  const locale = assertLocale((await params).locale)
  const t = getDictionary(locale)
  const page = parsePageParam((await searchParams).page)
  const day = todayKey()
  const [upcoming, past] = await Promise.all([
    getEventsPage({ locale, when: 'upcoming', limit: 24, day }),
    getEventsPage({ locale, when: 'past', page, day }),
  ])

  return (
    <>
      <PageHeader locale={locale} title={t.events} breadcrumb={[{ label: t.events }]} />
      <Section labelledBy="upcoming">
        <SectionHeading id="upcoming" title={t.upcomingEvents} />
        {upcoming.docs.length ? (
          <CardGrid>
            {upcoming.docs.map((e) => (
              <EventCard key={e.id} event={e} locale={locale} />
            ))}
          </CardGrid>
        ) : (
          <p className="text-muted">{t.noItems}</p>
        )}
      </Section>
      <Section id="past" tone="surface" labelledBy="past-heading">
        <SectionHeading id="past-heading" title={t.pastEvents} />
        {past.docs.length ? (
          <CardGrid>
            {past.docs.map((e) => (
              <EventCard key={e.id} event={e} locale={locale} />
            ))}
          </CardGrid>
        ) : (
          <p className="text-muted">{t.noItems}</p>
        )}
        <Pagination
          locale={locale}
          page={past.page ?? 1}
          totalPages={past.totalPages}
          hrefFor={(p) => pastHref(locale, p)}
        />
      </Section>
    </>
  )
}
