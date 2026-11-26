import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionary'
import { sectionHref } from '@/lib/i18n/routes'
import {
  getCampuses,
  getEventsPage,
  getLatestNews,
  getMajors,
  getPrograms,
  todayKey,
} from '@/lib/queries'
import type { CardGridBlock, Media } from '@/payload-types'

import { Card, CardGrid } from '../card'
import { formatDate, formatDateTime } from '../format'
import { Badge, ButtonLink, Section, SectionHeading } from '../ui'

type Item = {
  key: string
  title: string
  text?: string | null
  image?: Media | number | null
  href?: string | null
  meta?: string
  badge?: string
}

async function loadItems(block: CardGridBlock, locale: Locale): Promise<Item[]> {
  const limit = block.limit ?? 6
  const t = getDictionary(locale)
  switch (block.source) {
    case 'programs':
      return (await getPrograms(locale)).slice(0, limit).map((p) => ({
        key: `p${p.id}`,
        title: p.title,
        text: p.summary,
        image: p.heroImage,
        href: sectionHref(locale, 'programs', p.slug),
        badge: p.level === 'master' ? t.master : t.bachelor,
      }))
    case 'majors':
      return (await getMajors(locale)).slice(0, limit).map((m) => ({
        key: `m${m.id}`,
        title: m.title,
        text: m.summary,
        image: m.heroImage,
        href: sectionHref(locale, 'majors', m.slug),
      }))
    case 'news':
      return (await getLatestNews(locale, limit, todayKey())).map((n) => ({
        key: `n${n.id}`,
        title: n.title,
        text: n.excerpt,
        image: n.featuredImage,
        href: sectionHref(locale, 'news', n.slug),
        meta: formatDate(n.publishedAt, locale),
      }))
    case 'events':
      return (await getEventsPage({ locale, when: 'upcoming', limit, day: todayKey() })).docs.map(
        (e) => ({
          key: `e${e.id}`,
          title: e.title,
          image: e.featuredImage,
          href: sectionHref(locale, 'events', e.slug),
          meta: [formatDateTime(e.startAt, locale), e.location].filter(Boolean).join(' · '),
          badge: e.registrationOpen ? t.registrationOpen : undefined,
        }),
      )
    case 'campuses':
      return (await getCampuses(locale)).slice(0, limit).map((c) => ({
        key: `c${c.id}`,
        title: c.name,
        text: c.address,
        image: Array.isArray(c.images) ? c.images[0] : null,
        href: sectionHref(locale, 'campuses', c.slug),
        meta: c.phone ?? undefined,
      }))
    default:
      return (block.items ?? []).map((it, i) => ({
        key: it.id ?? `i${i}`,
        title: it.title,
        text: it.text,
        image: it.image,
        href: it.url,
      }))
  }
}

export async function CardGridBlockView({
  block,
  locale,
}: {
  block: CardGridBlock
  locale: Locale
}) {
  const items = await loadItems(block, locale)
  if (!items.length) return null
  const columns = Number(block.columns ?? 3) as 2 | 3 | 4
  const headingId = block.heading ? `cg-${block.id ?? block.source}` : undefined
  return (
    <Section labelledBy={headingId}>
      {block.heading ? (
        <SectionHeading id={headingId} title={block.heading} intro={block.intro} />
      ) : null}
      <CardGrid columns={columns}>
        {items.map((it) => (
          <Card
            key={it.key}
            title={it.title}
            text={it.text}
            image={it.image}
            href={it.href}
            meta={it.meta}
            badge={it.badge ? <Badge tone="brand">{it.badge}</Badge> : undefined}
            headingLevel={block.heading ? 'h3' : 'h2'}
          />
        ))}
      </CardGrid>
      {block.moreLink?.label && block.moreLink.url ? (
        <div className="mt-8 text-center">
          <ButtonLink href={block.moreLink.url} variant="secondary">
            {block.moreLink.label}
          </ButtonLink>
        </div>
      ) : null}
    </Section>
  )
}
