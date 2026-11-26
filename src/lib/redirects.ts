import { defaultLocale } from './i18n/config'
import { docHref } from './i18n/routes'

/**
 * Bảng redirect (collection "redirects" của plugin) cache trong bộ nhớ cho proxy.ts.
 * - Làm mới theo TTL (mặc định 60s) — đủ cho PM2 cluster nhiều process.
 * - Trong cùng process, hook afterChange gọi bumpRedirectsVersion() → lần request sau nạp lại ngay.
 */

export type RedirectDoc = {
  from?: string | null
  type?: string | null
  to?: {
    type?: string | null
    url?: string | null
    reference?: {
      relationTo: string
      value: number | string | { slug?: string | null } | null
    } | null
  } | null
}

export type RedirectTarget = { location: string; status: 301 | 302 }
export type RedirectMap = Map<string, RedirectTarget>

/** Chuẩn hoá path để so khớp: bỏ origin + query, decode, chữ thường, bỏ "/" cuối. */
export function normalizePath(input: string): string {
  let p = input.trim()
  try {
    if (/^https?:\/\//i.test(p)) p = new URL(p).pathname
  } catch {
    // giữ nguyên
  }
  p = p.split('?')[0]!.split('#')[0]!
  try {
    p = decodeURIComponent(p)
  } catch {
    // giữ nguyên nếu chuỗi mã hoá hỏng
  }
  if (!p.startsWith('/')) p = `/${p}`
  p = p.replace(/\/{2,}/g, '/').toLowerCase()
  if (p.length > 1) p = p.replace(/\/+$/, '')
  return p
}

function resolveTarget(doc: RedirectDoc): string | null {
  const to = doc.to
  if (!to) return null
  if (to.type === 'reference' && to.reference) {
    const value = to.reference.value
    const slug = value && typeof value === 'object' ? value.slug : null
    return slug ? docHref(defaultLocale, to.reference.relationTo, slug) : null
  }
  return to.url?.trim() || null
}

export function buildRedirectMap(docs: RedirectDoc[]): RedirectMap {
  const map: RedirectMap = new Map()
  for (const doc of docs) {
    if (!doc.from) continue
    const location = resolveTarget(doc)
    if (!location) continue
    const from = normalizePath(doc.from)
    // Bỏ redirect vòng (from === to)
    if (!/^https?:\/\//i.test(location) && normalizePath(location) === from) continue
    map.set(from, { location, status: doc.type === '302' ? 302 : 301 })
  }
  return map
}

type CacheState = {
  version: number
  loadedVersion: number
  loadedAt: number
  map: RedirectMap
  inflight: Promise<RedirectMap> | null
}

const globalKey = '__swinRedirectCache' as const
type GlobalWithCache = typeof globalThis & { [globalKey]?: CacheState }

function state(): CacheState {
  const g = globalThis as GlobalWithCache
  g[globalKey] ??= { version: 0, loadedVersion: -1, loadedAt: 0, map: new Map(), inflight: null }
  return g[globalKey]
}

export function bumpRedirectsVersion(): void {
  state().version += 1
}

export async function getRedirectMap(
  loader: () => Promise<RedirectDoc[]>,
  ttlMs = 60_000,
  now: () => number = Date.now,
): Promise<RedirectMap> {
  const s = state()
  const fresh = s.loadedVersion === s.version && now() - s.loadedAt < ttlMs
  if (fresh) return s.map
  if (s.inflight) return s.inflight

  const versionAtStart = s.version
  s.inflight = loader()
    .then((docs) => {
      s.map = buildRedirectMap(docs)
      s.loadedAt = now()
      s.loadedVersion = versionAtStart
      return s.map
    })
    .catch(() => {
      // Lỗi tải (DB/server khởi động) → dùng bảng cũ, thử lại sau 10s
      s.loadedAt = now() - ttlMs + 10_000
      s.loadedVersion = versionAtStart
      return s.map
    })
    .finally(() => {
      s.inflight = null
    })
  return s.inflight
}

/** Chỉ dùng trong test */
export function resetRedirectCache(): void {
  const g = globalThis as GlobalWithCache
  delete g[globalKey]
}
