import Link from 'next/link'

import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionary'
import { homeHref } from '@/lib/i18n/routes'
import { getHeader, getLeadFormOptions, getSiteSettings } from '@/lib/queries'
import { resolveTurnstileSiteKey } from '@/lib/turnstile'

import { LanguageSwitcher } from './language-switcher'
import { LeadDialog } from './lead-dialog'
import { Logo } from './logo'
import { MobileMenu } from './mobile-menu'
import { SmartLink } from './smart-link'
import { buttonClass } from './ui'

export type NavItem = {
  label: string
  url: string | null
  children: { label: string; url: string; external: boolean }[]
}

export async function Header({ locale }: { locale: Locale }) {
  const t = getDictionary(locale)
  const [header, settings, formOptions] = await Promise.all([
    getHeader(locale),
    getSiteSettings(locale),
    getLeadFormOptions(locale),
  ])

  const items: NavItem[] = (header.navItems ?? []).map((n) => ({
    label: n.label,
    url: n.url ?? null,
    children: (n.children ?? []).map((c) => ({
      label: c.label,
      url: c.url,
      external: Boolean(c.external),
    })),
  }))
  const ctaLabel = header.cta?.label || t.register
  const ctaUrl = header.cta?.url || (locale === 'vi' ? '/dang-ky-tu-van' : '/en/register')

  return (
    <>
      {/* Không dùng backdrop-filter: nó biến header thành containing block của các phần tử fixed bên trong */}
      <header className="sticky top-0 z-50 border-b border-line bg-white [--header-h:4rem] lg:[--header-h:5rem]">
        {header.utilityLinks?.length ? (
          <div className="hidden bg-dark text-white xl:block">
            <div className="container-site flex h-9 items-center justify-end gap-5 text-sm">
              {header.utilityLinks.map((l) => (
                <SmartLink
                  key={l.url}
                  href={l.url}
                  className="opacity-90 hover:opacity-100 hover:underline"
                >
                  {l.label}
                </SmartLink>
              ))}
            </div>
          </div>
        ) : null}
        <div className="container-site flex h-16 items-center gap-4 lg:h-20">
          <Link
            href={homeHref(locale)}
            className="shrink-0"
            aria-label={`${settings.siteName || t.siteName} — ${t.home}`}
          >
            <Logo logo={settings.logo} />
          </Link>

          <nav aria-label="Menu" className="ml-auto hidden xl:block">
            <ul className="flex items-center">
              {items.map((item) => (
                <li key={item.label} className="group relative">
                  {item.url ? (
                    <Link
                      href={item.url}
                      className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-semibold whitespace-nowrap hover:text-brand 2xl:px-3 2xl:text-[0.95rem]"
                      aria-haspopup={item.children.length ? 'true' : undefined}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      aria-haspopup="true"
                      className="inline-flex min-h-11 cursor-default items-center px-2 text-sm font-semibold whitespace-nowrap 2xl:px-3 2xl:text-[0.95rem]"
                    >
                      {item.label}
                    </button>
                  )}
                  {item.children.length ? (
                    <ul className="invisible absolute top-full left-0 z-50 min-w-64 rounded-(--radius-card) border border-line bg-white p-2 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      {item.children.map((c) => (
                        <li key={c.url}>
                          <a
                            href={c.url}
                            {...(c.external
                              ? { target: '_blank', rel: 'noopener noreferrer' }
                              : {})}
                            className="block rounded-md px-3 py-2 text-ink-soft hover:bg-surface hover:text-brand"
                          >
                            {c.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-2 xl:ml-2">
            <LanguageSwitcher locale={locale} label={t.language} />
            <span className="hidden sm:inline-flex">
              <a
                href={ctaUrl}
                data-lead-dialog
                className={buttonClass('primary', 'sm', 'whitespace-nowrap')}
              >
                {ctaLabel}
              </a>
            </span>
            <MobileMenu items={items} labels={{ menu: t.menu, close: t.closeMenu }} />
          </div>
        </div>
      </header>
      {/* CTA cố định ở đáy màn hình di động */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white p-3 sm:hidden">
        <a href={ctaUrl} data-lead-dialog className={buttonClass('primary', 'md', 'w-full')}>
          {ctaLabel}
        </a>
      </div>
      <LeadDialog
        locale={locale}
        options={formOptions}
        turnstileSiteKey={resolveTurnstileSiteKey(settings.turnstileSiteKey)}
      />
    </>
  )
}
