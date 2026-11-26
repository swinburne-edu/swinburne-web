import type { Payload } from 'payload'

import type { Lead } from '@/payload-types'
import { toCrmPayload, type CrmClient } from '@/lib/crm'
import { normalizeVnPhone, type LeadSubmission } from './schema'

/** Sau MAX_CRM_ATTEMPTS lần thất bại → failed + email cảnh báo (CLAUDE.md mục 7) */
export const MAX_CRM_ATTEMPTS = 5

/** Độ trễ trước lần thử thứ (attempts + 1): 1 phút, 5 phút, 15 phút, 60 phút */
const BACKOFF_MS = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000]

export function nextRetryDelayMs(attemptsSoFar: number): number {
  const idx = Math.min(Math.max(attemptsSoFar - 1, 0), BACKOFF_MS.length - 1)
  return BACKOFF_MS[idx]!
}

export const CRM_QUEUE = 'crm'

/**
 * Lưu lead (crmStatus = pending). Idempotent theo idempotencyKey:
 * gửi trùng (bấm 2 lần, mạng chập chờn) trả lại lead cũ, không tạo bản ghi mới.
 */
export async function createLead(
  payload: Payload,
  input: LeadSubmission,
): Promise<{ lead: Lead; duplicate: boolean }> {
  const existing = await payload.find({
    collection: 'leads',
    where: { idempotencyKey: { equals: input.idempotencyKey } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (existing.docs[0]) return { lead: existing.docs[0], duplicate: true }

  try {
    const lead = await payload.create({
      collection: 'leads',
      overrideAccess: true,
      data: {
        fullName: input.fullName,
        phone: normalizeVnPhone(input.phone) ?? input.phone,
        email: input.email || undefined,
        programInterest: input.programInterest,
        campus: input.campus,
        locale: input.locale,
        sourceUrl: input.sourceUrl,
        utm: input.utm,
        gclid: input.gclid,
        fbclid: input.fbclid,
        idempotencyKey: input.idempotencyKey,
        crmStatus: 'pending',
        crmAttempts: 0,
      },
    })
    return { lead, duplicate: false }
  } catch (err) {
    // Hai request trùng key chạy song song: request sau dính unique → đọc lại bản đã có
    const again = await payload.find({
      collection: 'leads',
      where: { idempotencyKey: { equals: input.idempotencyKey } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (again.docs[0]) return { lead: again.docs[0], duplicate: true }
    throw err
  }
}

export type SyncOutcome =
  | { status: 'sent'; attempts: number }
  | { status: 'pending'; attempts: number; retryInMs: number }
  | { status: 'failed'; attempts: number }
  | { status: 'skipped'; reason: string }

export type SyncDeps = {
  crm: CrmClient
  now?: () => Date
  alert?: (lead: Lead, error: string) => Promise<void>
}

/** Gửi một lead sang CRM và cập nhật trạng thái. Không ném lỗi do CRM. */
export async function syncLeadToCrm(
  payload: Payload,
  leadId: number,
  deps: SyncDeps,
): Promise<SyncOutcome> {
  const now = deps.now ?? (() => new Date())
  let lead: Lead
  try {
    lead = await payload.findByID({
      collection: 'leads',
      id: leadId,
      depth: 0,
      overrideAccess: true,
    })
  } catch {
    return { status: 'skipped', reason: 'not-found' }
  }
  if (lead.crmStatus !== 'pending') return { status: 'skipped', reason: `status=${lead.crmStatus}` }

  const attempts = (lead.crmAttempts ?? 0) + 1
  const result = await deps.crm.sendLead(toCrmPayload(lead), lead.idempotencyKey)
  const attemptAt = now().toISOString()

  if (result.ok) {
    await payload.update({
      collection: 'leads',
      id: leadId,
      overrideAccess: true,
      data: {
        crmStatus: 'sent',
        crmAttempts: attempts,
        crmLastAttemptAt: attemptAt,
        crmResponse: { status: result.status, body: result.body ?? null },
      },
    })
    return { status: 'sent', attempts }
  }

  const response = { status: result.status ?? null, error: result.error, body: result.body ?? null }
  const giveUp = !result.retryable || attempts >= MAX_CRM_ATTEMPTS

  await payload.update({
    collection: 'leads',
    id: leadId,
    overrideAccess: true,
    data: {
      crmStatus: giveUp ? 'failed' : 'pending',
      crmAttempts: attempts,
      crmLastAttemptAt: attemptAt,
      crmResponse: response,
    },
  })

  if (giveUp) {
    payload.logger.error(
      { leadId, attempts, error: result.error },
      'Lead gửi CRM thất bại, đã dừng thử lại',
    )
    const alert = deps.alert ?? ((l: Lead, e: string) => sendCrmFailureAlert(payload, l, e))
    await alert({ ...lead, crmAttempts: attempts }, result.error).catch((e: unknown) =>
      payload.logger.error({ err: e }, 'Không gửi được email cảnh báo lead lỗi'),
    )
    return { status: 'failed', attempts }
  }

  return { status: 'pending', attempts, retryInMs: nextRetryDelayMs(attempts) }
}

/** Xếp lịch thử lại bằng Payload Jobs Queue */
export async function queueCrmRetry(
  payload: Payload,
  leadId: number,
  delayMs: number,
): Promise<void> {
  await payload.jobs.queue({
    task: 'crmSync',
    input: { leadId },
    queue: CRM_QUEUE,
    waitUntil: new Date(Date.now() + delayMs),
  })
}

export async function sendCrmFailureAlert(
  payload: Payload,
  lead: Lead,
  error: string,
): Promise<void> {
  const to = process.env.ALERT_EMAIL
  if (!to) {
    payload.logger.warn({ leadId: lead.id }, 'ALERT_EMAIL chưa cấu hình — bỏ qua email cảnh báo')
    return
  }
  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/admin/collections/leads/${lead.id}`
  await payload.sendEmail({
    to,
    subject: `[Swinburne VN] Lead #${lead.id} không đẩy được sang CRM`,
    text: [
      `Lead #${lead.id} đã thử gửi CRM ${lead.crmAttempts ?? '?'} lần và thất bại.`,
      `Lỗi cuối: ${error}`,
      '',
      `Họ tên: ${lead.fullName}`,
      `Điện thoại: ${lead.phone}`,
      `Email: ${lead.email ?? '-'}`,
      `Chương trình: ${lead.programInterest ?? '-'}`,
      `Thời gian: ${lead.createdAt}`,
      '',
      `Xem trong admin: ${adminUrl}`,
      'Lead vẫn được lưu an toàn trong website. Sau khi CRM hoạt động lại, đổi trạng thái về "Đang chờ" để gửi lại.',
    ].join('\n'),
  })
}
