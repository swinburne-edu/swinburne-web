/**
 * Giới hạn tần suất đơn giản trong bộ nhớ (mỗi process PM2 một bảng).
 * Đủ để chặn spam form cơ bản; Turnstile là lớp chặn chính.
 */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>()
  return {
    check(key: string, now: number = Date.now()): boolean {
      const since = now - windowMs
      const list = (hits.get(key) ?? []).filter((t) => t > since)
      if (list.length >= limit) {
        hits.set(key, list)
        return false
      }
      list.push(now)
      hits.set(key, list)
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (!v.some((t) => t > since)) hits.delete(k)
      }
      return true
    },
  }
}

export function clientIp(headers: Headers): string | null {
  const fwd = headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim() || null
  return headers.get('x-real-ip')
}
