import Link from 'next/link'

import { buttonClass } from '@/components/ui'
import { getDictionary } from '@/lib/i18n/dictionary'

/** 404 song ngữ (not-found không nhận params nên hiển thị cả hai ngôn ngữ). */
export default function NotFound() {
  const vi = getDictionary('vi')
  const en = getDictionary('en')
  return (
    <div className="container-site py-20 text-center md:py-28">
      <p className="text-7xl font-bold text-brand">404</p>
      <h1 className="mt-4 text-3xl font-bold">
        {vi.notFoundTitle}
        <span className="mt-1 block text-xl font-semibold text-muted" lang="en">
          {en.notFoundTitle}
        </span>
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-ink-soft">{vi.notFoundText}</p>
      <p className="mx-auto mt-1 max-w-xl text-muted" lang="en">
        {en.notFoundText}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonClass('primary')}>
          {vi.backHome}
        </Link>
        <Link href="/en" className={buttonClass('secondary')} lang="en">
          {en.backHome}
        </Link>
      </div>
    </div>
  )
}
