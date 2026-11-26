import Link from 'next/link'

import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionary'
import { sectionHref } from '@/lib/i18n/routes'
import { getCampuses, getFooter, getSiteSettings } from '@/lib/queries'

import { SmartLink } from './smart-link'

const socialLabel: Record<string, string> = {
  facebook: 'Facebook',
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  zalo: 'Zalo',
}

export async function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale)
  const [footer, campuses, settings] = await Promise.all([
    getFooter(locale),
    getCampuses(locale),
    getSiteSettings(locale),
  ])

  return (
    <footer className="bg-dark pb-24 text-white/85 sm:pb-0">
      <div className="container-site grid gap-10 py-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="text-xl font-bold tracking-[0.15em] text-white">SWINBURNE</p>
          <p className="mt-1 text-sm text-white/70">{settings.tagline}</p>
          {footer.about ? <p className="mt-4 text-sm leading-relaxed">{footer.about}</p> : null}
          {settings.generalEmail ? (
            <p className="mt-4 text-sm">
              {t.email}:{' '}
              <a className="underline hover:text-white" href={`mailto:${settings.generalEmail}`}>
                {settings.generalEmail}
              </a>
            </p>
          ) : null}
        </div>

        <div className="md:col-span-5">
          <h2 className="text-sm font-bold tracking-wider text-white uppercase">{t.campuses}</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {campuses.map((c) => (
              <li key={c.id} className="text-sm">
                <Link
                  href={sectionHref(locale, 'campuses', c.slug)}
                  className="font-semibold text-white hover:underline"
                >
                  {c.name}
                </Link>
                <p className="mt-1 text-white/75">{c.address}</p>
                {c.phone ? (
                  <p className="mt-1">
                    <a
                      href={`tel:${c.phone.replace(/\s/g, '')}`}
                      className="hover:text-white hover:underline"
                    >
                      {c.phone}
                    </a>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          {footer.quickLinks?.length ? (
            <>
              <h2 className="text-sm font-bold tracking-wider text-white uppercase">
                {t.quickLinks}
              </h2>
              <ul className="mt-4 space-y-2 text-sm">
                {footer.quickLinks.map((l) => (
                  <li key={l.url}>
                    <SmartLink href={l.url} className="hover:text-white hover:underline">
                      {l.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {footer.social?.length ? (
            <>
              <h2 className="mt-8 text-sm font-bold tracking-wider text-white uppercase">
                {t.followUs}
              </h2>
              <ul className="mt-4 flex flex-wrap gap-3 text-sm">
                {footer.social.map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center rounded-md border border-white/25 px-3 hover:border-white"
                    >
                      {socialLabel[s.platform] ?? s.platform}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </div>
      <div className="border-t border-white/15">
        <p className="container-site py-5 text-xs text-white/65">
          {footer.copyright || `© ${new Date().getFullYear()} Swinburne Vietnam`}
        </p>
      </div>
    </footer>
  )
}
