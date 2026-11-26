export const locales = ['vi', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'vi'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}

export function toLocale(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale
}

/** Mã ngôn ngữ dùng cho thẻ html lang / og:locale */
export const htmlLang: Record<Locale, string> = { vi: 'vi', en: 'en' }
export const ogLocale: Record<Locale, string> = { vi: 'vi_VN', en: 'en_US' }
