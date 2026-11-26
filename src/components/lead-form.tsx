'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useRef, useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'

import { buttonClass } from '@/components/ui'
import {
  ATTRIBUTION_COOKIE,
  deserializeAttribution,
  parseAttribution,
  readCookie,
  resolveAttribution,
} from '@/lib/attribution'
import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionary'
import { leadFormSchema, type LeadFormValues } from '@/lib/leads/schema'

import { Turnstile } from './turnstile'

export type LeadFormOptionsProp = {
  programs: { group: string; options: string[] }[]
  campuses: string[]
}

type Props = {
  locale: Locale
  options: LeadFormOptionsProp
  turnstileSiteKey: string
  defaultProgram?: string
  heading?: string | null
  intro?: string | null
  /** Heading level của tiêu đề form (h2 trong trang, h2 trong dialog) */
  headingId?: string
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

function newKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (Number(c) ^ ((Math.random() * 16) >> (Number(c) / 4))).toString(16),
      )
}

export function LeadForm({
  locale,
  options,
  turnstileSiteKey,
  defaultProgram,
  heading,
  intro,
  headingId,
}: Props) {
  const t = getDictionary(locale)
  const uid = useId()
  const [status, setStatus] = useState<Status>('idle')
  const [token, setToken] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const idempotencyKey = useRef<string>(newKey())
  const tokenWaiters = useRef<((t: string | null) => void)[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema(locale)),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      programInterest: defaultProgram ?? '',
      campus: '',
    },
    mode: 'onTouched',
  })

  const handleToken = (value: string | null) => {
    setToken(value)
    if (value) {
      tokenWaiters.current.forEach((fn) => fn(value))
      tokenWaiters.current = []
    }
  }

  /** Turnstile ở chế độ "interaction-only" thường trả token sau 1–2 giây */
  const waitForToken = () =>
    token
      ? Promise.resolve(token)
      : new Promise<string | null>((resolve) => {
          tokenWaiters.current.push(resolve)
          setTimeout(() => resolve(null), 15000)
        })

  const onValid = async (values: LeadFormValues) => {
    setStatus('submitting')
    try {
      const turnstileToken = await waitForToken()
      const current = parseAttribution(new URLSearchParams(window.location.search))
      const stored = deserializeAttribution(readCookie(document.cookie, ATTRIBUTION_COOKIE))
      const attribution = resolveAttribution(current, stored)
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          locale,
          sourceUrl: window.location.href,
          utm: attribution.utm,
          gclid: attribution.gclid,
          fbclid: attribution.fbclid,
          turnstileToken: turnstileToken ?? undefined,
          idempotencyKey: idempotencyKey.current,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStatus('success')
      reset()
      idempotencyKey.current = newKey()
      setToken(null)
      setResetKey((k) => k + 1)
      window.dataLayer?.push({ event: 'lead_submit', lead_locale: locale })
    } catch {
      setStatus('error')
      setToken(null)
      setResetKey((k) => k + 1)
    }
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    void handleSubmit(onValid)(e)
  }

  const titleId = headingId ?? `${uid}-title`

  if (status === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-(--radius-card) border border-green-200 bg-green-50 p-6"
      >
        <h2 id={titleId} className="text-xl font-bold text-success">
          {t.thankYouTitle}
        </h2>
        <p className="mt-2 text-ink-soft">{t.thankYouText}</p>
        <button
          type="button"
          className={buttonClass('secondary', 'sm', 'mt-4')}
          onClick={() => setStatus('idle')}
        >
          OK
        </button>
      </div>
    )
  }

  const field =
    'mt-1 block w-full rounded-md border border-line bg-white px-3 py-2.5 text-base text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 aria-[invalid=true]:border-brand'
  const label = 'block text-sm font-semibold text-ink'
  const err = 'mt-1 text-sm font-medium text-brand-dark'

  const fid = (name: string) => `${uid}-${name}`

  return (
    <form onSubmit={onSubmit} noValidate aria-labelledby={titleId} className="space-y-4">
      <div>
        <h2 id={titleId} className="text-xl font-bold md:text-2xl">
          {heading || t.formTitle}
        </h2>
        <p className="mt-1 text-ink-soft">{intro || t.formIntro}</p>
      </div>

      <div>
        <label htmlFor={fid('fullName')} className={label}>
          {t.fullName}{' '}
          <span aria-hidden="true" className="text-brand">
            *
          </span>
          <span className="sr-only"> ({t.required})</span>
        </label>
        <input
          id={fid('fullName')}
          autoComplete="name"
          className={field}
          aria-invalid={errors.fullName ? 'true' : 'false'}
          aria-describedby={errors.fullName ? fid('fullName-err') : undefined}
          {...register('fullName')}
        />
        {errors.fullName ? (
          <p id={fid('fullName-err')} className={err}>
            {errors.fullName.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={fid('phone')} className={label}>
            {t.phoneNumber}{' '}
            <span aria-hidden="true" className="text-brand">
              *
            </span>
            <span className="sr-only"> ({t.required})</span>
          </label>
          <input
            id={fid('phone')}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={field}
            aria-invalid={errors.phone ? 'true' : 'false'}
            aria-describedby={errors.phone ? fid('phone-err') : undefined}
            {...register('phone')}
          />
          {errors.phone ? (
            <p id={fid('phone-err')} className={err}>
              {errors.phone.message}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor={fid('email')} className={label}>
            {t.email}
          </label>
          <input
            id={fid('email')}
            type="email"
            autoComplete="email"
            className={field}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? fid('email-err') : undefined}
            {...register('email')}
          />
          {errors.email ? (
            <p id={fid('email-err')} className={err}>
              {errors.email.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={fid('programInterest')} className={label}>
            {t.programInterest}
          </label>
          <select id={fid('programInterest')} className={field} {...register('programInterest')}>
            <option value="">{t.choose}</option>
            {options.programs.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={fid('campus')} className={label}>
            {t.campus}
          </label>
          <select id={fid('campus')} className={field} {...register('campus')}>
            <option value="">{t.choose}</option>
            {options.campuses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-start gap-3">
          <input
            id={fid('consent')}
            type="checkbox"
            className="mt-1 h-5 w-5 shrink-0 accent-brand"
            aria-invalid={errors.consent ? 'true' : 'false'}
            aria-describedby={errors.consent ? fid('consent-err') : undefined}
            {...register('consent')}
          />
          <label htmlFor={fid('consent')} className="text-sm text-ink-soft">
            {t.consent}
          </label>
        </div>
        {errors.consent ? (
          <p id={fid('consent-err')} className={err}>
            {errors.consent.message}
          </p>
        ) : null}
      </div>

      {/* Bẫy bot — người dùng thật không thấy trường này */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={fid('website')}>Website</label>
        <input id={fid('website')} name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <Turnstile
        siteKey={turnstileSiteKey}
        locale={locale}
        onToken={handleToken}
        resetKey={resetKey}
      />

      <div aria-live="assertive">
        {status === 'error' ? (
          <p
            role="alert"
            className="rounded-md bg-brand-light p-3 text-sm font-medium text-brand-dark"
          >
            {t.formError}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        className={buttonClass('primary', 'lg', 'w-full sm:w-auto')}
        disabled={status === 'submitting'}
      >
        {status === 'submitting' ? t.submitting : t.submit}
      </button>
    </form>
  )
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}
