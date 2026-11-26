import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import type { ReactNode } from 'react'

import { AttributionCapture } from '@/components/attribution-capture'
import { Footer } from '@/components/footer'
import { GoogleTagManager } from '@/components/gtm'
import { Header } from '@/components/header'
import { htmlLang } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionary'
import { assertLocale, siteName, type LocaleParams } from '@/lib/page-helpers'
import { getSiteSettings } from '@/lib/queries'
import { getSiteUrl, isNoindexEnv } from '@/lib/site'

import './globals.css'

// Một họ font, 3 độ đậm, tự host qua next/font, có subset tiếng Việt (CLAUDE.md mục 10)
const font = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-be-vietnam',
})

/**
 * Không prerender lúc build (GitHub Actions không có DB production): mọi trang render lần đầu
 * khi có request rồi cache (ISR), xoá cache bằng revalidateTag khi Payload xuất bản.
 * Locale không hợp lệ → assertLocale() trả 404.
 */
export function generateStaticParams(): { locale: string }[] {
  return []
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#d42027',
}

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = assertLocale((await params).locale)
  const name = await siteName(locale)
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: name, template: `%s | ${name}` },
    applicationName: name,
    robots: isNoindexEnv() ? { index: false, follow: false } : undefined,
    formatDetection: { telephone: false },
  }
}

export default async function FrontendLayout({
  children,
  params,
}: {
  children: ReactNode
  params: LocaleParams
}) {
  const locale = assertLocale((await params).locale)
  const t = getDictionary(locale)
  const settings = await getSiteSettings(locale)

  return (
    <html lang={htmlLang[locale]} className={font.variable}>
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="skip-link">
          {t.skipToContent}
        </a>
        <Header locale={locale} />
        <main id="main" className="flex-1" tabIndex={-1}>
          {children}
        </main>
        <Footer locale={locale} />
        <AttributionCapture />
        {settings.gtmId ? <GoogleTagManager gtmId={settings.gtmId} /> : null}
      </body>
    </html>
  )
}
