import Link from 'next/link'

import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionary'
import { homeHref } from '@/lib/i18n/routes'
import { breadcrumbJsonLd } from '@/lib/seo/jsonld'
import { absoluteUrl } from '@/lib/site'

import { JsonLd } from './json-ld'

export type BreadcrumbItem = { label: string; href?: string }

/** Breadcrumb + JSON-LD BreadcrumbList. Mục cuối là trang hiện tại. */
export function Breadcrumb({ locale, items }: { locale: Locale; items: BreadcrumbItem[] }) {
  const t = getDictionary(locale)
  const all: BreadcrumbItem[] = [{ label: t.home, href: homeHref(locale) }, ...items]
  const ld = breadcrumbJsonLd(
    all.filter((i) => i.href).map((i) => ({ name: i.label, url: absoluteUrl(i.href!) })),
  )
  return (
    <>
      <nav aria-label={t.breadcrumb} className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {all.map((item, i) => {
            const last = i === all.length - 1
            return (
              <li key={`${item.label}-${i}`} className="flex items-center gap-2">
                {item.href && !last ? (
                  <Link href={item.href} className="hover:text-brand hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={last ? 'page' : undefined}
                    className="line-clamp-1 text-ink-soft"
                  >
                    {item.label}
                  </span>
                )}
                {!last ? <span aria-hidden="true">/</span> : null}
              </li>
            )
          })}
        </ol>
      </nav>
      <JsonLd data={ld} />
    </>
  )
}
