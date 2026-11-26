import type { Payload } from 'payload'

import type { CrmClient } from '@/lib/crm'
import type { TurnstileVerifier } from '@/lib/turnstile'
import { leadSubmissionSchema } from './schema'
import { createLead, queueCrmRetry, syncLeadToCrm, type SyncOutcome } from './service'

export type LeadHandlerDeps = {
  payload: Payload
  crm: CrmClient
  verifyTurnstile: TurnstileVerifier
  queueRetry?: (payload: Payload, leadId: number, delayMs: number) => Promise<void>
}

export type LeadHandlerResult = {
  status: number
  body:
    | { ok: true; crmStatus?: string }
    | { ok: false; error: string; issues?: Record<string, string> }
}

/**
 * Luồng POST /api/leads (CLAUDE.md mục 7):
 * validate Zod → verify Turnstile → LƯU LEAD TRƯỚC (pending) → gọi CRM → cập nhật trạng thái.
 * Lỗi CRM không làm hỏng phản hồi cho người dùng: lead đã lưu, sẽ được thử lại.
 */
export async function handleLeadSubmission(
  raw: unknown,
  ip: string | null,
  deps: LeadHandlerDeps,
): Promise<LeadHandlerResult> {
  const locale = (raw as { locale?: unknown } | null)?.locale === 'en' ? 'en' : 'vi'
  const parsed = leadSubmissionSchema(locale).safeParse(raw)
  if (!parsed.success) {
    const issues: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || '_'
      issues[key] ??= issue.message
    }
    return { status: 400, body: { ok: false, error: 'validation', issues } }
  }

  const input = parsed.data
  // Honeypot: bot điền trường ẩn → trả 200 giả, không lưu
  if (input.website) return { status: 200, body: { ok: true } }

  const captcha = await deps.verifyTurnstile(input.turnstileToken, ip)
  if (!captcha.success) {
    return { status: 403, body: { ok: false, error: 'captcha' } }
  }

  const { lead, duplicate } = await createLead(deps.payload, input)
  if (duplicate) return { status: 200, body: { ok: true, crmStatus: lead.crmStatus } }

  let outcome: SyncOutcome
  try {
    outcome = await syncLeadToCrm(deps.payload, lead.id, { crm: deps.crm })
  } catch (err) {
    // Lỗi bất ngờ khi cập nhật trạng thái — lead vẫn pending, để job thử lại
    deps.payload.logger.error({ err, leadId: lead.id }, 'Lỗi khi đồng bộ lead sang CRM')
    outcome = { status: 'pending', attempts: 0, retryInMs: 60_000 }
  }

  if (outcome.status === 'pending') {
    const queue = deps.queueRetry ?? queueCrmRetry
    await queue(deps.payload, lead.id, outcome.retryInMs).catch((err: unknown) =>
      deps.payload.logger.error(
        { err, leadId: lead.id },
        'Không xếp được job thử lại; sweep định kỳ sẽ xử lý',
      ),
    )
  }

  const crmStatus = outcome.status === 'skipped' ? lead.crmStatus : outcome.status
  return { status: 201, body: { ok: true, crmStatus } }
}
