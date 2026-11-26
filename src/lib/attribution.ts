/**
 * Thu UTM / gclid / fbclid từ URL lần đầu vào trang, lưu cookie first-party 30 ngày (first-touch).
 * Dùng được cả server lẫn client (không phụ thuộc DOM).
 */
export const ATTRIBUTION_COOKIE = 'swin_attr'
export const ATTRIBUTION_MAX_AGE_DAYS = 30

export type Attribution = {
  utm?: { source?: string; medium?: string; campaign?: string; term?: string; content?: string }
  gclid?: string
  fbclid?: string
  /** Thời điểm ghi nhận (ISO) */
  ts?: string
}

const UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content'] as const
const MAX_LEN = 200

const clean = (v: string | null): string | undefined => {
  const t = v?.trim()
  return t ? t.slice(0, MAX_LEN) : undefined
}

/** Trả null nếu URL không có tham số quảng cáo nào */
export function parseAttribution(
  params: URLSearchParams,
  now: Date = new Date(),
): Attribution | null {
  const utm: NonNullable<Attribution['utm']> = {}
  for (const key of UTM_KEYS) {
    const v = clean(params.get(`utm_${key}`))
    if (v) utm[key] = v
  }
  const gclid = clean(params.get('gclid'))
  const fbclid = clean(params.get('fbclid'))
  if (!Object.keys(utm).length && !gclid && !fbclid) return null
  return {
    ...(Object.keys(utm).length ? { utm } : {}),
    ...(gclid ? { gclid } : {}),
    ...(fbclid ? { fbclid } : {}),
    ts: now.toISOString(),
  }
}

export function serializeAttribution(a: Attribution): string {
  return encodeURIComponent(JSON.stringify(a))
}

export function deserializeAttribution(raw: string | undefined | null): Attribution | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw))
    if (typeof parsed !== 'object' || parsed === null) return null
    const obj = parsed as Record<string, unknown>
    const out: Attribution = {}
    if (typeof obj.utm === 'object' && obj.utm !== null) {
      const utm: NonNullable<Attribution['utm']> = {}
      for (const key of UTM_KEYS) {
        const v = (obj.utm as Record<string, unknown>)[key]
        if (typeof v === 'string' && v) utm[key] = v.slice(0, MAX_LEN)
      }
      if (Object.keys(utm).length) out.utm = utm
    }
    if (typeof obj.gclid === 'string') out.gclid = obj.gclid.slice(0, MAX_LEN)
    if (typeof obj.fbclid === 'string') out.fbclid = obj.fbclid.slice(0, MAX_LEN)
    if (typeof obj.ts === 'string') out.ts = obj.ts
    return out
  } catch {
    return null
  }
}

export function readCookie(cookieHeader: string, name: string): string | null {
  for (const part of cookieHeader.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return rest.join('=')
  }
  return null
}

/**
 * Giá trị gắn vào form: tham số trên URL hiện tại (nếu có) ưu tiên hơn cookie,
 * để chiến dịch đang chạy được ghi nhận khi người dùng gửi ngay trong phiên.
 */
export function resolveAttribution(
  current: Attribution | null,
  stored: Attribution | null,
): Attribution {
  return current ?? stored ?? {}
}
