import type { Locale } from '@/lib/i18n/config'
import { getLeadFormOptions, getSiteSettings } from '@/lib/queries'
import { resolveTurnstileSiteKey } from '@/lib/turnstile'

import { LeadForm } from './lead-form'
import { Section } from './ui'

type Props = {
  locale: Locale
  heading?: string | null
  intro?: string | null
  anchor?: string | null
  defaultProgram?: string
}

/** Khối form đăng ký nhúng trong trang (server lấy options rồi render form client). */
export async function LeadFormSection({
  locale,
  heading,
  intro,
  anchor = 'dang-ky',
  defaultProgram,
}: Props) {
  const [options, settings] = await Promise.all([
    getLeadFormOptions(locale),
    getSiteSettings(locale),
  ])
  return (
    <Section id={anchor || undefined} tone="surface" className="scroll-mt-24">
      <div className="mx-auto max-w-3xl rounded-(--radius-card) border border-line bg-white p-6 shadow-sm md:p-10">
        <LeadForm
          locale={locale}
          options={options}
          turnstileSiteKey={resolveTurnstileSiteKey(settings.turnstileSiteKey)}
          heading={heading}
          intro={intro}
          defaultProgram={defaultProgram}
        />
      </div>
    </Section>
  )
}
