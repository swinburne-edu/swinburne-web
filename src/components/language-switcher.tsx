'use client'

import type { MouseEvent, SyntheticEvent } from 'react'

import type { Locale } from '@/lib/i18n/config'

type Props = { locale: Locale; label: string }

/** Đọc <link rel="alternate" hreflang> của trang hiện tại (generateMetadata sinh khi có đủ bản dịch) */
function alternateHref(target: Locale): string | null {
  const link = document.querySelector<HTMLLinkElement>(
    `link[rel="alternate"][hreflang="${target}"]`,
  )
  if (!link?.href) return null
  try {
    const u = new URL(link.href)
    return `${u.pathname}${u.search}`
  } catch {
    return null
  }
}

/**
 * Chuyển ngôn ngữ giữ đúng trang tương ứng. Không có bản dịch → về trang chủ ngôn ngữ kia.
 * href thật được cập nhật khi hover/focus/click (không dùng state → không render lại).
 */
export function LanguageSwitcher({ locale, label }: Props) {
  const target: Locale = locale === 'vi' ? 'en' : 'vi'
  const fallback = target === 'vi' ? '/' : '/en'

  const sync = (e: SyntheticEvent<HTMLAnchorElement>) => {
    e.currentTarget.setAttribute('href', alternateHref(target) ?? fallback)
  }
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => sync(e)

  return (
    <a
      href={fallback}
      hrefLang={target}
      lang={target}
      onPointerEnter={sync}
      onFocus={sync}
      onClick={onClick}
      className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-semibold hover:text-brand"
    >
      <span className="sr-only">{label}: </span>
      {target === 'en' ? 'EN' : 'VI'}
    </a>
  )
}
