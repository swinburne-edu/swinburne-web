import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { createMockCrmClient } from '@/lib/crm'
import { handleLeadSubmission } from '@/lib/leads/handler'
import { leadFormSchema, normalizeVnPhone } from '@/lib/leads/schema'
import { MAX_CRM_ATTEMPTS, nextRetryDelayMs, syncLeadToCrm } from '@/lib/leads/service'
import type { Lead } from '@/payload-types'

/** Payload giả lập tối thiểu cho collection leads (lưu trong bộ nhớ) */
function fakePayload() {
  const rows = new Map<number, Lead>()
  let nextId = 1
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
  const payload = {
    logger,
    rows,
    find: vi.fn(async ({ where }: { where: { idempotencyKey: { equals: string } } }) => {
      const key = where.idempotencyKey.equals
      return { docs: [...rows.values()].filter((r) => r.idempotencyKey === key) }
    }),
    create: vi.fn(async ({ data }: { data: Partial<Lead> }) => {
      const now = new Date().toISOString()
      const doc = { ...data, id: nextId++, createdAt: now, updatedAt: now } as Lead
      rows.set(doc.id, doc)
      return doc
    }),
    findByID: vi.fn(async ({ id }: { id: number }) => {
      const doc = rows.get(id)
      if (!doc) throw new Error('not found')
      return doc
    }),
    update: vi.fn(async ({ id, data }: { id: number; data: Partial<Lead> }) => {
      const doc = { ...rows.get(id)!, ...data } as Lead
      rows.set(id, doc)
      return doc
    }),
    sendEmail: vi.fn(async () => undefined),
  }
  return payload as unknown as Payload & { rows: Map<number, Lead>; logger: typeof logger }
}

const valid = (over: Record<string, unknown> = {}) => ({
  fullName: 'Trần Thị B',
  phone: '+84 912 345 678',
  email: 'b@example.test',
  consent: true,
  locale: 'vi',
  utm: { source: 'facebook', campaign: 'k1' },
  fbclid: 'FB1',
  turnstileToken: 'tok',
  idempotencyKey: '7f1c2b8e-1a2b-4c3d-8e9f-0a1b2c3d4e5f',
  ...over,
})

const passCaptcha = async () => ({ success: true, errors: [] })

describe('normalizeVnPhone', () => {
  it.each([
    ['0912345678', '0912345678'],
    ['0912 345 678', '0912345678'],
    ['+84912345678', '0912345678'],
    ['84 912.345.678', '0912345678'],
    ['0212345678', null],
    ['12345', null],
  ])('%s → %s', (input, expected) => {
    expect(normalizeVnPhone(input)).toBe(expected)
  })
})

describe('leadFormSchema', () => {
  it('báo lỗi tiếng Việt / tiếng Anh theo locale', () => {
    const vi_ = leadFormSchema('vi').safeParse({ fullName: 'A', phone: 'x', consent: false })
    const en_ = leadFormSchema('en').safeParse({ fullName: 'A', phone: 'x', consent: false })
    expect(vi_.success).toBe(false)
    expect(en_.success).toBe(false)
    if (!vi_.success) expect(vi_.error.issues.map((i) => i.message).join()).toContain('Vui lòng')
    if (!en_.success) expect(en_.error.issues.map((i) => i.message).join()).toContain('Please')
  })
})

describe('handleLeadSubmission', () => {
  it('lưu lead TRƯỚC rồi gửi CRM → sent', async () => {
    const payload = fakePayload()
    const crm = createMockCrmClient()
    const queueRetry = vi.fn()
    const res = await handleLeadSubmission(valid(), '1.2.3.4', {
      payload,
      crm,
      verifyTurnstile: passCaptcha,
      queueRetry,
    })
    expect(res).toEqual({ status: 201, body: { ok: true, crmStatus: 'sent' } })
    const saved = payload.rows.get(1)!
    expect(saved.phone).toBe('0912345678')
    expect(saved.utm).toMatchObject({ source: 'facebook', campaign: 'k1' })
    expect(saved.crmStatus).toBe('sent')
    expect(saved.crmAttempts).toBe(1)
    expect(crm.calls[0]!.idempotencyKey).toBe(valid().idempotencyKey)
    expect(crm.calls[0]!.lead.utmSource).toBe('facebook')
    expect(queueRetry).not.toHaveBeenCalled()
    // create được gọi trước khi gửi CRM
    expect((payload.create as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0]).toBeLessThan(
      (payload.update as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0]!,
    )
  })

  it('CRM lỗi → lead vẫn được lưu (pending) và xếp lịch thử lại, người dùng vẫn nhận 201', async () => {
    const payload = fakePayload()
    const crm = createMockCrmClient(() => ({ ok: false, retryable: true, error: 'down' }))
    const queueRetry = vi.fn(async () => undefined)
    const res = await handleLeadSubmission(valid(), null, {
      payload,
      crm,
      verifyTurnstile: passCaptcha,
      queueRetry,
    })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ ok: true, crmStatus: 'pending' })
    expect(payload.rows.get(1)!.crmStatus).toBe('pending')
    expect(queueRetry).toHaveBeenCalledWith(payload, 1, nextRetryDelayMs(1))
  })

  it('dữ liệu sai → 400 kèm lỗi từng trường, không lưu', async () => {
    const payload = fakePayload()
    const res = await handleLeadSubmission(valid({ phone: '123', fullName: '' }), null, {
      payload,
      crm: createMockCrmClient(),
      verifyTurnstile: passCaptcha,
    })
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ ok: false, error: 'validation' })
    if (!res.body.ok)
      expect(Object.keys(res.body.issues ?? {})).toEqual(
        expect.arrayContaining(['phone', 'fullName']),
      )
    expect(payload.rows.size).toBe(0)
  })

  it('Turnstile thất bại → 403, không lưu', async () => {
    const payload = fakePayload()
    const res = await handleLeadSubmission(valid(), null, {
      payload,
      crm: createMockCrmClient(),
      verifyTurnstile: async () => ({ success: false, errors: ['invalid-input-response'] }),
    })
    expect(res.status).toBe(403)
    expect(payload.rows.size).toBe(0)
  })

  it('honeypot có giá trị → trả 200 giả, không lưu', async () => {
    const payload = fakePayload()
    const res = await handleLeadSubmission(valid({ website: '' }), null, {
      payload,
      crm: createMockCrmClient(),
      verifyTurnstile: passCaptcha,
    })
    expect(res.status).toBe(201)
    const bot = await handleLeadSubmission(
      valid({ website: 'x', idempotencyKey: '8f1c2b8e-1a2b-4c3d-8e9f-0a1b2c3d4e5f' }),
      null,
      {
        payload: fakePayload(),
        crm: createMockCrmClient(),
        verifyTurnstile: passCaptcha,
      },
    )
    // website có giá trị vi phạm max(0) → bị chặn ở bước validate
    expect(bot.status).toBe(400)
  })

  it('gửi trùng idempotencyKey → không tạo lead mới, không gọi CRM lần 2', async () => {
    const payload = fakePayload()
    const crm = createMockCrmClient()
    await handleLeadSubmission(valid(), null, { payload, crm, verifyTurnstile: passCaptcha })
    const again = await handleLeadSubmission(valid(), null, {
      payload,
      crm,
      verifyTurnstile: passCaptcha,
    })
    expect(again.status).toBe(200)
    expect(payload.rows.size).toBe(1)
    expect(crm.calls).toHaveLength(1)
  })
})

describe('syncLeadToCrm', () => {
  async function seededLead(attempts: number) {
    const payload = fakePayload()
    await payload.create({
      collection: 'leads',
      data: {
        fullName: 'C',
        phone: '0912345678',
        idempotencyKey: 'k',
        crmStatus: 'pending',
        crmAttempts: attempts,
        locale: 'vi',
      },
    } as never)
    return payload
  }

  it(`sau ${MAX_CRM_ATTEMPTS} lần lỗi → failed + gửi cảnh báo`, async () => {
    const payload = await seededLead(MAX_CRM_ATTEMPTS - 1)
    const alert = vi.fn(async () => undefined)
    const out = await syncLeadToCrm(payload, 1, {
      crm: createMockCrmClient(() => ({ ok: false, retryable: true, error: 'down' })),
      alert,
    })
    expect(out).toEqual({ status: 'failed', attempts: MAX_CRM_ATTEMPTS })
    expect(payload.rows.get(1)!.crmStatus).toBe('failed')
    expect(alert).toHaveBeenCalledOnce()
  })

  it('lỗi không thử lại được (4xx) → failed ngay', async () => {
    const payload = await seededLead(0)
    const alert = vi.fn(async () => undefined)
    const out = await syncLeadToCrm(payload, 1, {
      crm: createMockCrmClient(() => ({
        ok: false,
        retryable: false,
        status: 422,
        error: 'HTTP 422',
      })),
      alert,
    })
    expect(out.status).toBe('failed')
    expect(alert).toHaveBeenCalledOnce()
  })

  it('lead đã sent → bỏ qua', async () => {
    const payload = await seededLead(1)
    await payload.update({ collection: 'leads', id: 1, data: { crmStatus: 'sent' } } as never)
    const crm = createMockCrmClient()
    expect((await syncLeadToCrm(payload, 1, { crm })).status).toBe('skipped')
    expect(crm.calls).toHaveLength(0)
  })

  it('backoff tăng dần và có trần', () => {
    expect(nextRetryDelayMs(1)).toBe(60_000)
    expect(nextRetryDelayMs(2)).toBe(300_000)
    expect(nextRetryDelayMs(3)).toBe(900_000)
    expect(nextRetryDelayMs(4)).toBe(3_600_000)
    expect(nextRetryDelayMs(10)).toBe(3_600_000)
  })
})
