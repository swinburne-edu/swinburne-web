import type { ReactNode } from 'react'

import type { Locale } from '@/lib/i18n/config'

import { Breadcrumb, type BreadcrumbItem } from './breadcrumb'
import { Container } from './ui'

type Props = {
  locale: Locale
  title: string
  intro?: string | null
  breadcrumb: BreadcrumbItem[]
  meta?: ReactNode
  children?: ReactNode
}

/** Đầu trang chuẩn: breadcrumb + đúng một h1 */
export function PageHeader({ locale, title, intro, breadcrumb, meta, children }: Props) {
  return (
    <div className="border-b border-line bg-surface">
      <Container className="py-8 md:py-12">
        <Breadcrumb locale={locale} items={breadcrumb} />
        {meta ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">{meta}</div>
        ) : null}
        <h1 className="mt-3 max-w-4xl text-3xl leading-tight font-bold md:text-4xl">{title}</h1>
        {intro ? <p className="mt-4 max-w-3xl text-lg text-ink-soft">{intro}</p> : null}
        {children}
      </Container>
    </div>
  )
}
