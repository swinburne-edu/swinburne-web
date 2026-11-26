import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { NewsList, newsListHref } from '@/components/news-list'
import { PageHeader } from '@/components/page-header'
import { Section } from '@/components/ui'
import { getDictionary } from '@/lib/i18n/dictionary'
import { archiveHref } from '@/lib/i18n/routes'
import { assertLocale, parsePageParam, siteName, type LocaleParams } from '@/lib/page-helpers'
import { getCategories, getNewsPage, todayKey } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo/metadata'

// Dùng searchParams (phân trang, lọc) → render theo request; dữ liệu vẫn cache theo tag
export const dynamic = 'force-dynamic'

type Search = Promise<{ page?: string; category?: string }>

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: LocaleParams
  searchParams: Search
}): Promise<Metadata> {
  const locale = assertLocale((await params).locale)
  const sp = await searchParams
  const t = getDictionary(locale)
  const page = parsePageParam(sp.page)
  const category = sp.category ?? null
  return buildMetadata({
    locale,
    title: page > 1 ? `${t.news} — ${t.page} ${page}` : t.news,
    path: newsListHref(locale, { page, category }),
    alternates: category
      ? undefined
      : { vi: newsListHref('vi', { page }), en: newsListHref('en', { page }) },
    siteName: await siteName(locale),
  })
}

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: LocaleParams
  searchParams: Search
}) {
  const locale = assertLocale((await params).locale)
  const sp = await searchParams
  const t = getDictionary(locale)
  const page = parsePageParam(sp.page)
  const category = sp.category?.slice(0, 120) ?? null
  const [result, categories] = await Promise.all([
    getNewsPage({ locale, page, category, archived: false, day: todayKey() }),
    getCategories(locale),
  ])
  if (!result) notFound()
  if (page > 1 && page > result.totalPages) notFound()

  return (
    <>
      <PageHeader locale={locale} title={t.news} breadcrumb={[{ label: t.news }]}>
        <p className="mt-4 text-sm">
          <Link href={archiveHref(locale)} className="font-semibold text-brand hover:underline">
            {t.archive} →
          </Link>
          <span className="ml-2 text-muted">{t.archiveNote}</span>
        </p>
      </PageHeader>
      <Section>
        <NewsList
          locale={locale}
          docs={result.docs}
          page={result.page ?? 1}
          totalPages={result.totalPages}
          categories={categories}
          activeCategory={category}
        />
      </Section>
    </>
  )
}
