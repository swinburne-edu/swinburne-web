import type { Metadata } from 'next'
import Link from 'next/link'

import { formatDate } from '@/components/format'
import { PageHeader } from '@/components/page-header'
import { Pagination } from '@/components/pagination'
import { Badge, Section } from '@/components/ui'
import { getDictionary, researchTypeLabel } from '@/lib/i18n/dictionary'
import { sectionHref } from '@/lib/i18n/routes'
import { assertLocale, parsePageParam, siteName, type LocaleParams } from '@/lib/page-helpers'
import { getResearchPage } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo/metadata'

// Dùng searchParams (phân trang) → render theo request; dữ liệu vẫn cache theo tag
export const dynamic = 'force-dynamic'

type Search = Promise<{ page?: string }>

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = assertLocale((await params).locale)
  const t = getDictionary(locale)
  return buildMetadata({
    locale,
    title: t.research,
    path: sectionHref(locale, 'research'),
    alternates: { vi: sectionHref('vi', 'research'), en: sectionHref('en', 'research') },
    siteName: await siteName(locale),
  })
}

export default async function ResearchPage({
  params,
  searchParams,
}: {
  params: LocaleParams
  searchParams: Search
}) {
  const locale = assertLocale((await params).locale)
  const t = getDictionary(locale)
  const page = parsePageParam((await searchParams).page)
  const result = await getResearchPage(locale, page)
  const base = sectionHref(locale, 'research')

  return (
    <>
      <PageHeader locale={locale} title={t.research} breadcrumb={[{ label: t.research }]} />
      <Section>
        {result.docs.length ? (
          <ul className="divide-y divide-line rounded-(--radius-card) border border-line">
            {result.docs.map((r) => (
              <li key={r.id} className="p-5">
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                  <Badge tone="brand">{researchTypeLabel[locale][r.type]}</Badge>
                  {r.publishedAt ? (
                    <time dateTime={r.publishedAt}>{formatDate(r.publishedAt, locale)}</time>
                  ) : null}
                </div>
                <h2 className="mt-2 text-lg font-semibold">
                  <Link href={sectionHref(locale, 'research', r.slug)} className="hover:text-brand">
                    {r.title}
                  </Link>
                </h2>
                {r.authors ? <p className="mt-1 text-sm text-ink-soft">{r.authors}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">{t.noItems}</p>
        )}
        <Pagination
          locale={locale}
          page={result.page ?? 1}
          totalPages={result.totalPages}
          hrefFor={(p) => (p > 1 ? `${base}?page=${p}` : base)}
        />
      </Section>
    </>
  )
}
