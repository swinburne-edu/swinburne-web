import { z } from 'zod'

import type { Locale } from '@/lib/i18n/config'

/** Dùng chung client (React Hook Form) và server (/api/leads). Không import gì của server. */

const messages = {
  vi: {
    fullName: 'Vui lòng nhập họ tên (2–100 ký tự)',
    phone: 'Số điện thoại không hợp lệ (vd 0912 345 678)',
    email: 'Email không hợp lệ',
    consent: 'Vui lòng đồng ý để chúng tôi liên hệ',
  },
  en: {
    fullName: 'Please enter your full name (2–100 characters)',
    phone: 'Invalid phone number (e.g. 0912 345 678)',
    email: 'Invalid email address',
    consent: 'Please agree to be contacted',
  },
} as const

/** Chuẩn hoá số di động VN về dạng 0xxxxxxxxx; trả null nếu không hợp lệ. */
export function normalizeVnPhone(input: string): string | null {
  const digits = input.replace(/[\s.\-()]/g, '')
  const m = /^(?:\+?84|0)([35789]\d{8})$/.exec(digits)
  return m ? `0${m[1]}` : null
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined))

export function leadFormSchema(locale: Locale = 'vi') {
  const t = messages[locale]
  return z.object({
    fullName: z.string().trim().min(2, t.fullName).max(100, t.fullName),
    phone: z
      .string()
      .trim()
      .refine((v) => normalizeVnPhone(v) !== null, t.phone),
    email: z
      .string()
      .trim()
      .max(200)
      .refine((v) => v === '' || z.email().safeParse(v).success, t.email)
      .optional(),
    programInterest: optionalText(200),
    campus: optionalText(100),
    consent: z.literal(true, { error: t.consent }),
  })
}

export type LeadFormValues = z.input<ReturnType<typeof leadFormSchema>>

const attributionSchema = z.object({
  source: optionalText(200),
  medium: optionalText(200),
  campaign: optionalText(200),
  term: optionalText(200),
  content: optionalText(200),
})

/** Payload đầy đủ client gửi lên /api/leads */
export function leadSubmissionSchema(locale: Locale = 'vi') {
  return leadFormSchema(locale).extend({
    locale: z.enum(['vi', 'en']).default('vi'),
    sourceUrl: optionalText(1000),
    utm: attributionSchema.optional(),
    gclid: optionalText(300),
    fbclid: optionalText(300),
    turnstileToken: z.string().max(4096).optional(),
    idempotencyKey: z.uuid(),
    /** Bẫy bot: trường ẩn phải để trống */
    website: z.string().max(0).optional(),
  })
}

export type LeadSubmission = z.output<ReturnType<typeof leadSubmissionSchema>>
