import clsx from 'clsx'
import Link from 'next/link'

import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionary'
import { archiveHref, sectionHref } from '@/lib/i18n/routes'
import type { Category, News } from '@/payload-types'

import { Card, CardGrid } from './card'
import { formatDate } from './format'
import { Pagination } from './pagination'
import { Badge } from './ui'

export function newsListHref(
  locale: Locale,
  opts: { page?: number; category?: string | null; archived?: boolean },
) {
  const base = opts.archived ? archiveHref(locale) : sectionHref(locale, 'news')
  const qs = new URLSearchParams()
  if (opts.category) qs.set('category', opts.category)
  if (opts.page && opts.page > 1) qs.set('page', String(opts.page))
  const s = qs.toString()
  return s ? `${base}?${s}` : base
}

type Props = {
  locale: Locale
  docs: News[]
  page: number
  totalPages: number
  categories: Category[]
  activeCategory: string | null
  archived?: boolean
}

export function NewsList({
  locale,
  docs,
  page,
  totalPages,
  categories,
  activeCategory,
  archived,
}: Props) {
  const t = getDictionary(locale)
  const chip = 'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold'
  return (
    <>
      {categories.length ? (
        <nav aria-label={t.categories} className="mb-8">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href={newsListHref(locale, { archived })}
                aria-current={!activeCategory ? 'page' : undefined}
                className={clsx(
                  chip,
                  !activeCategory
                    ? 'border-brand bg-brand text-white'
                    : 'border-line hover:border-brand',
                )}
              >
                {t.allCategories}
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={newsListHref(locale, { category: c.slug, archived })}
                  aria-current={activeCategory === c.slug ? 'page' : undefined}
                  className={clsx(
                    chip,
                    activeCategory === c.slug
                      ? 'border-brand bg-brand text-white'
                      : 'border-line hover:border-brand',
                  )}
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {docs.length ? (
        <CardGrid>
          {docs.map((n) => {
            const cat = (n.categories ?? []).find(
              (c): c is Category => typeof c === 'object' && c !== null,
            )
            return (
              <Card
                key={n.id}
                title={n.title}
                text={n.excerpt}
                image={n.featuredImage}
                href={sectionHref(locale, 'news', n.slug)}
                meta={
                  <time dateTime={n.publishedAt ?? undefined}>
                    {formatDate(n.publishedAt, locale)}
                  </time>
                }
                badge={cat ? <Badge>{cat.title}</Badge> : undefined}
                headingLevel="h2"
              />
            )
          })}
        </CardGrid>
      ) : (
        <p className="text-muted">{t.noItems}</p>
      )}

      <Pagination
        locale={locale}
        page={page}
        totalPages={totalPages}
        hrefFor={(p) => newsListHref(locale, { page: p, category: activeCategory, archived })}
      />
    </>
  )
}
