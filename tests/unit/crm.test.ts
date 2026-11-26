import { describe, expect, it, vi } from 'vitest'

import {
  createHttpCrmClient,
  createMockCrmClient,
  createUnconfiguredCrmClient,
  getCrmClient,
  toCrmPayload,
  type CrmLeadPayload,
} from '@/lib/crm'

const lead: CrmLeadPayload = toCrmPayload({
  fullName: 'Nguyễn Văn A',
  phone: '0912345678',
  email: 'a@example.test',
  programInterest: 'Cử nhân',
  campus: 'Hà Nội',
  locale: 'vi',
  sourceUrl: 'https://swinburne-vn.edu.vn/?utm_source=google',
  utm: { source: 'google', medium: 'cpc', campaign: 'c1' },
  gclid: 'G1',
  fbclid: null,
  createdAt: '2026-11-25T00:00:00.000Z',
})

describe('toCrmPayload', () => {
  it('làm phẳng utm và chuẩn hoá giá trị rỗng thành null', () => {
    expect(lead.utmSource).toBe('google')
    expect(lead.utmMedium).toBe('cpc')
    expect(lead.utmTerm).toBeNull()
    expect(lead.fbclid).toBeNull()
    expect(lead.createdAt).toBe('2026-11-25T00:00:00.000Z')
  })
})

describe('createHttpCrmClient', () => {
  it('gửi Bearer token + Idempotency-Key, trả ok khi 2xx', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: 7 }), { status: 201 }))
    const client = createHttpCrmClient({ url: 'https://crm.test/api/leads', token: 'T', fetchImpl })
    const res = await client.sendLead(lead, 'key-1')
    expect(res).toEqual({ ok: true, status: 201, body: { id: 7 } })
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://crm.test/api/leads')
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer T')
    expect(headers['Idempotency-Key']).toBe('key-1')
    expect(JSON.parse(init.body as string)).toMatchObject({
      fullName: 'Nguyễn Văn A',
      utmSource: 'google',
    })
  })

  it('409 (trùng Idempotency-Key) được coi là đã nhận', async () => {
    const client = createHttpCrmClient({
      url: 'u',
      token: 't',
      fetchImpl: async () => new Response('dup', { status: 409 }),
    })
    expect((await client.sendLead(lead, 'k')).ok).toBe(true)
  })

  it('5xx và 429 → lỗi có thể thử lại', async () => {
    for (const status of [500, 503, 429]) {
      const client = createHttpCrmClient({
        url: 'u',
        token: 't',
        fetchImpl: async () => new Response('', { status }),
      })
      const res = await client.sendLead(lead, 'k')
      expect(res).toMatchObject({ ok: false, retryable: true, status })
    }
  })

  it('4xx (vd 422) → lỗi không thử lại', async () => {
    const client = createHttpCrmClient({
      url: 'u',
      token: 't',
      fetchImpl: async () =>
        new Response(JSON.stringify({ errors: { phone: 'invalid' } }), { status: 422 }),
    })
    const res = await client.sendLead(lead, 'k')
    expect(res).toMatchObject({
      ok: false,
      retryable: false,
      status: 422,
      body: { errors: { phone: 'invalid' } },
    })
  })

  it('timeout → lỗi có thể thử lại', async () => {
    const fetchImpl = (_: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          const err = new Error('aborted')
          err.name = 'AbortError'
          reject(err)
        })
      })
    const client = createHttpCrmClient({ url: 'u', token: 't', timeoutMs: 20, fetchImpl })
    const res = await client.sendLead(lead, 'k')
    expect(res).toMatchObject({ ok: false, retryable: true })
    if (!res.ok) expect(res.error).toContain('Timeout')
  })

  it('lỗi mạng → lỗi có thể thử lại', async () => {
    const client = createHttpCrmClient({
      url: 'u',
      token: 't',
      fetchImpl: async () => {
        throw new Error('ECONNREFUSED')
      },
    })
    expect(await client.sendLead(lead, 'k')).toMatchObject({
      ok: false,
      retryable: true,
      error: 'ECONNREFUSED',
    })
  })
})

describe('getCrmClient', () => {
  it('chưa cấu hình → client báo lỗi retryable (lead giữ pending)', async () => {
    const client = getCrmClient({ NODE_ENV: 'test' } as NodeJS.ProcessEnv)
    expect(await client.sendLead(lead, 'k')).toMatchObject({ ok: false, retryable: true })
    expect(await createUnconfiguredCrmClient().sendLead(lead, 'k')).toMatchObject({ ok: false })
  })
})

describe('createMockCrmClient', () => {
  it('ghi lại lời gọi', async () => {
    const mock = createMockCrmClient()
    await mock.sendLead(lead, 'abc')
    expect(mock.calls).toHaveLength(1)
    expect(mock.calls[0]!.idempotencyKey).toBe('abc')
  })
})
