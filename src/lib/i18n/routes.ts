import { defaultLocale, isLocale, type Locale } from './config'

/**
 * Định tuyến song ngữ.
 *
 * URL công khai:  vi không tiền tố (/tin-tuc/abc), en có tiền tố (/en/news/abc).
 * Route nội bộ:   /{locale}/{section}/... trong src/app/(frontend)/[locale]/...
 *                 Trang động (collection pages) nằm dưới /{locale}/p/[...slug].
 *
 * proxy.ts dịch URL công khai → route nội bộ (rewrite); các hàm href*() làm chiều ngược lại.
 */
export const sections = ['programs', 'majors', 'campuses', 'news', 'events', 'research'] as const
export type Section = (typeof sections)[number]

export const sectionSegments: Record<Section, Record<Locale, string>> = {
  programs: { vi: 'chuong-trinh', en: 'programs' },
  majors: { vi: 'nganh', en: 'majors' },
  campuses: { vi: 'co-so', en: 'campuses' },
  news: { vi: 'tin-tuc', en: 'news' },
  events: { vi: 'su-kien', en: 'events' },
  research: { vi: 'nghien-cuu', en: 'research' },
}

/** Đoạn con đặc biệt trong một section (vd. mục Lưu trữ của tin tức) */
export const subSegments = {
  archive: { vi: 'luu-tru', en: 'archive' },
} as const satisfies Record<string, Record<Locale, string>>

/** Route nội bộ không thuộc collection (không dịch) */
const utilitySegments = ['styleguide'] as const

/** Slug trang chủ trong collection pages */
export const HOME_SLUG = 'home'

const PAGES_PREFIX = 'p'

function prefix(locale: Locale): string {
  return locale === defaultLocale ? '' : `/${locale}`
}

export function homeHref(locale: Locale): string {
  return locale === defaultLocale ? '/' : `/${locale}`
}

export function sectionHref(locale: Locale, section: Section, slug?: string | null): string {
  const base = `${prefix(locale)}/${sectionSegments[section][locale]}`
  return slug ? `${base}/${encodeURIComponent(slug)}` : base
}

export function archiveHref(locale: Locale): string {
  return `${sectionHref(locale, 'news')}/${subSegments.archive[locale]}`
}

export function pageHref(locale: Locale, slug: string): string {
  if (slug === HOME_SLUG) return homeHref(locale)
  return `${prefix(locale)}/${slug.split('/').map(encodeURIComponent).join('/')}`
}

/** Collection slug → section (để dựng URL từ một tài liệu bất kỳ) */
export const collectionSection: Partial<Record<string, Section>> = {
  programs: 'programs',
  majors: 'majors',
  campuses: 'campuses',
  news: 'news',
  events: 'events',
  research: 'research',
}

export function docHref(locale: Locale, collection: string, slug: string): string {
  if (collection === 'pages') return pageHref(locale, slug)
  const section = collectionSection[collection]
  return section ? sectionHref(locale, section, slug) : pageHref(locale, slug)
}

export type ResolvedRoute =
  | { kind: 'rewrite'; locale: Locale; internalPath: string }
  | { kind: 'redirect'; location: string }

function findSection(segment: string, locale: Locale): Section | undefined {
  return sections.find((s) => sectionSegments[s][locale] === segment)
}

/**
 * Dịch pathname công khai → route nội bộ.
 * - /vi/...      → 301 về bản không tiền tố (tránh trùng nội dung)
 * - /{home-slug} → 301 về trang chủ
 */
export function resolvePublicPath(pathname: string): ResolvedRoute {
  const raw = pathname.split('/').filter(Boolean)
  let segments: string[]
  try {
    segments = raw.map((s) => decodeURIComponent(s))
  } catch {
    segments = raw
  }

  if (segments[0] === defaultLocale) {
    const rest = raw.slice(1).join('/')
    return { kind: 'redirect', location: `/${rest}` }
  }

  let locale: Locale = defaultLocale
  if (segments[0] && isLocale(segments[0])) {
    locale = segments[0]
    segments = segments.slice(1)
  }

  const enc = (parts: string[]) => parts.map(encodeURIComponent).join('/')

  if (segments.length === 0) {
    return { kind: 'rewrite', locale, internalPath: `/${locale}` }
  }

  const [first, ...rest] = segments as [string, ...string[]]

  if (segments.length === 1 && first === HOME_SLUG) {
    return { kind: 'redirect', location: homeHref(locale) }
  }

  const section = findSection(first, locale)
  if (section && rest.length <= 1) {
    if (rest.length === 1 && section === 'news' && rest[0] === subSegments.archive[locale]) {
      return { kind: 'rewrite', locale, internalPath: `/${locale}/news/archive` }
    }
    const tail = rest.length ? `/${enc(rest)}` : ''
    return { kind: 'rewrite', locale, internalPath: `/${locale}/${section}${tail}` }
  }

  if (segments.length === 1 && (utilitySegments as readonly string[]).includes(first)) {
    return { kind: 'rewrite', locale, internalPath: `/${locale}/${first}` }
  }

  return { kind: 'rewrite', locale, internalPath: `/${locale}/${PAGES_PREFIX}/${enc(segments)}` }
}
