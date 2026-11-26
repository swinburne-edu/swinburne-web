import clsx from 'clsx'
import Link from 'next/link'

import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionary'

type Props = {
  locale: Locale
  page: number
  totalPages: number
  /** Dựng URL cho một số trang */
  hrefFor: (page: number) => string
}

/** Dải số trang gọn: 1 … 4 5 6 … 20 */
export function pageWindow(page: number, total: number): (number | 'gap')[] {
  const pages = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total))
  const sorted = [...pages].sort((a, b) => a - b)
  const out: (number | 'gap')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push('gap')
    out.push(p)
  })
  return out
}

export function Pagination({ locale, page, totalPages, hrefFor }: Props) {
  if (totalPages <= 1) return null
  const t = getDictionary(locale)
  const linkCls =
    'inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-line px-3 hover:border-brand hover:text-brand'
  return (
    <nav aria-label={t.pagination} className="mt-10">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {page > 1 ? (
          <li>
            <Link href={hrefFor(page - 1)} rel="prev" className={linkCls}>
              ‹ <span className="sr-only sm:not-sr-only sm:ml-1">{t.previous}</span>
            </Link>
          </li>
        ) : null}
        {pageWindow(page, totalPages).map((p, i) =>
          p === 'gap' ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={hrefFor(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`${t.page} ${p}`}
                className={clsx(
                  linkCls,
                  p === page && 'border-brand bg-brand text-white hover:text-white',
                )}
              >
                {p}
              </Link>
            </li>
          ),
        )}
        {page < totalPages ? (
          <li>
            <Link href={hrefFor(page + 1)} rel="next" className={linkCls}>
              <span className="sr-only sm:not-sr-only sm:mr-1">{t.next}</span> ›
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  )
}
