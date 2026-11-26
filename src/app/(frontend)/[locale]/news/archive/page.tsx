import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { NewsList, newsListHref } from '@/components/news-list'
import { PageHeader } from '@/components/page-header'
import { Section } from '@/components/ui'
import { getDictionary } from '@/lib/i18n/dictionary'
import { sectionHref } from '@/lib/i18n/routes'
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
  return buildMetadata({
    locale,
    title: page > 1 ? `${t.archive} — ${t.page} ${page}` : `${t.archive} — ${t.news}`,
    path: newsListHref(locale, { page, archived: true, category: sp.category }),
    alternates: sp.category
      ? undefined
      : {
          vi: newsListHref('vi', { page, archived: true }),
          en: newsListHref('en', { page, archived: true }),
        },
    siteName: await siteName(locale),
  })
}

/** Mục Lưu trữ: tin > 18 tháng — không lên trang chủ nhưng vẫn index (CLAUDE.md mục 9). */
export default async function NewsArchivePage({
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
    getNewsPage({ locale, page, category, archived: true, day: todayKey() }),
    getCategories(locale),
  ])
  if (!result) notFound()
  if (page > 1 && page > result.totalPages) notFound()

  return (
    <>
      <PageHeader
        locale={locale}
        title={`${t.archive} — ${t.news}`}
        intro={t.archiveNote}
        breadcrumb={[{ label: t.news, href: sectionHref(locale, 'news') }, { label: t.archive }]}
      />
      <Section>
        <NewsList
          locale={locale}
          docs={result.docs}
          page={result.page ?? 1}
          totalPages={result.totalPages}
          categories={categories}
          activeCategory={category}
          archived
        />
      </Section>
    </>
  )
}
