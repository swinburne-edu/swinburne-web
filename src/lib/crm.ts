/**
 * Client gửi lead sang CRM Laravel (CLAUDE.md mục 7).
 *
 * TODO(chủ dự án): chưa có spec API CRM. Interface dưới đây là giả định, cần xác nhận:
 *   1. URL endpoint chính xác và phương thức (đang giả định POST CRM_API_URL, body JSON).
 *   2. Tên trường CRM nhận (đang gửi camelCase: fullName, utmSource, …).
 *   3. Mã trả về: 2xx = nhận; 409 = trùng Idempotency-Key (coi như đã nhận)? 422 = lỗi dữ liệu?
 *   4. CRM có trả ID lead trong body không (để lưu đối soát)?
 * Không tự đặt thêm endpoint khác.
 */

export type CrmLeadPayload = {
  fullName: string
  phone: string
  email: string | null
  programInterest: string | null
  campus: string | null
  locale: string
  sourceUrl: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmTerm: string | null
  utmContent: string | null
  gclid: string | null
  fbclid: string | null
  createdAt: string
}

export type CrmResult =
  | { ok: true; status: number; body: unknown }
  | { ok: false; retryable: boolean; status?: number; error: string; body?: unknown }

export interface CrmClient {
  sendLead(lead: CrmLeadPayload, idempotencyKey: string): Promise<CrmResult>
}

export const CRM_TIMEOUT_MS = 5000

type FetchLike = (input: string, init: RequestInit) => Promise<Response>

export type HttpCrmClientOptions = {
  url: string
  token: string
  timeoutMs?: number
  fetchImpl?: FetchLike
}

/** Mã HTTP 4xx vẫn nên thử lại */
const RETRYABLE_4XX = new Set([408, 425, 429])

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => '')
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text.slice(0, 2000)
  }
}

export function createHttpCrmClient(opts: HttpCrmClientOptions): CrmClient {
  const timeoutMs = opts.timeoutMs ?? CRM_TIMEOUT_MS
  const doFetch: FetchLike = opts.fetchImpl ?? ((input, init) => fetch(input, init))

  return {
    async sendLead(lead, idempotencyKey) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const res = await doFetch(opts.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${opts.token}`,
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(lead),
          signal: controller.signal,
        })
        const body = await readBody(res)
        if (res.ok) return { ok: true, status: res.status, body }
        // Giả định: 409 = CRM đã nhận lead với Idempotency-Key này → coi như thành công
        if (res.status === 409) return { ok: true, status: res.status, body }
        const retryable = res.status >= 500 || RETRYABLE_4XX.has(res.status)
        return { ok: false, retryable, status: res.status, error: `HTTP ${res.status}`, body }
      } catch (err) {
        const aborted = err instanceof Error && err.name === 'AbortError'
        return {
          ok: false,
          retryable: true,
          error: aborted
            ? `Timeout sau ${timeoutMs}ms`
            : err instanceof Error
              ? err.message
              : String(err),
        }
      } finally {
        clearTimeout(timer)
      }
    },
  }
}

/** Client dùng khi chưa cấu hình CRM: luôn báo lỗi có thể thử lại → lead giữ "pending". */
export function createUnconfiguredCrmClient(): CrmClient {
  return {
    async sendLead() {
      return {
        ok: false,
        retryable: true,
        error: 'CRM chưa được cấu hình (CRM_API_URL / CRM_API_TOKEN)',
      }
    },
  }
}

export type MockCrmBehavior = (
  lead: CrmLeadPayload,
  idempotencyKey: string,
) => CrmResult | Promise<CrmResult>

/** Mock cho test: ghi lại các lần gọi, trả kết quả theo behavior. */
export function createMockCrmClient(
  behavior: MockCrmBehavior = () => ({ ok: true, status: 201, body: { id: 'mock' } }),
) {
  const calls: { lead: CrmLeadPayload; idempotencyKey: string }[] = []
  const client: CrmClient & { calls: typeof calls } = {
    calls,
    async sendLead(lead, idempotencyKey) {
      calls.push({ lead, idempotencyKey })
      return behavior(lead, idempotencyKey)
    },
  }
  return client
}

export function getCrmClient(env: NodeJS.ProcessEnv = process.env): CrmClient {
  const url = env.CRM_API_URL?.trim()
  const token = env.CRM_API_TOKEN?.trim()
  if (!url || !token) return createUnconfiguredCrmClient()
  return createHttpCrmClient({ url, token })
}

type LeadLike = {
  fullName: string
  phone: string
  email?: string | null
  programInterest?: string | null
  campus?: string | null
  locale?: string | null
  sourceUrl?: string | null
  utm?: {
    source?: string | null
    medium?: string | null
    campaign?: string | null
    term?: string | null
    content?: string | null
  } | null
  gclid?: string | null
  fbclid?: string | null
  createdAt: string
}

export function toCrmPayload(lead: LeadLike): CrmLeadPayload {
  return {
    fullName: lead.fullName,
    phone: lead.phone,
    email: lead.email || null,
    programInterest: lead.programInterest || null,
    campus: lead.campus || null,
    locale: lead.locale || 'vi',
    sourceUrl: lead.sourceUrl || null,
    utmSource: lead.utm?.source || null,
    utmMedium: lead.utm?.medium || null,
    utmCampaign: lead.utm?.campaign || null,
    utmTerm: lead.utm?.term || null,
    utmContent: lead.utm?.content || null,
    gclid: lead.gclid || null,
    fbclid: lead.fbclid || null,
    createdAt: lead.createdAt,
  }
}
