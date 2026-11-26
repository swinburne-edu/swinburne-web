import { NextResponse, type NextRequest } from 'next/server'

import { resolvePublicPath } from '@/lib/i18n/routes'
import { getRedirectMap, normalizePath, type RedirectDoc } from '@/lib/redirects'

/**
 * Proxy (Next 16, trước đây gọi là middleware — CLAUDE.md mục 4/9). Chạy Node runtime.
 * 1. Tra bảng redirects (cache trong bộ nhớ, làm mới khi có thay đổi) → 301/302.
 * 2. Bỏ "/" cuối (thay cho redirect mặc định của Next để redirect cũ chỉ 1 bước).
 * 3. Dịch URL công khai (vi không tiền tố, en có /en) → route nội bộ /[locale]/...
 */

/** Gọi thẳng process Next qua localhost (không vòng qua Nginx/HTTPS) */
function internalOrigin(): string {
  return process.env.INTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`
}

async function loadRedirects(origin: string): Promise<RedirectDoc[]> {
  const res = await fetch(`${origin}/api/redirects?limit=0&pagination=false&depth=1&locale=vi`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(3000),
  })
  if (!res.ok) throw new Error(`redirects HTTP ${res.status}`)
  const json = (await res.json()) as { docs?: RedirectDoc[] }
  return json.docs ?? []
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // 1. Redirect từ bảng redirects (bỏ qua trang chủ)
  if (pathname !== '/') {
    const map = await getRedirectMap(() => loadRedirects(internalOrigin()))
    const hit = map.get(normalizePath(pathname))
    if (hit) {
      const target = /^https?:\/\//i.test(hit.location)
        ? new URL(hit.location)
        : new URL(hit.location, req.url)
      if (!target.search && search) target.search = search
      return NextResponse.redirect(target, hit.status)
    }
  }

  // 2. Bỏ dấu "/" cuối
  // (dùng new URL thay vì nextUrl.clone(): NextURL giữ lại "/" cuối của URL gốc khi format)
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return NextResponse.redirect(new URL(`${pathname.replace(/\/+$/, '')}${search}`, req.url), 308)
  }

  // 3. Định tuyến song ngữ
  const route = resolvePublicPath(pathname)
  if (route.kind === 'redirect') {
    return NextResponse.redirect(new URL(`${route.location}${search}`, req.url), 301)
  }
  // Dựng từ req.url (origin = hostname server bind), KHÔNG dùng req.nextUrl (origin lấy từ header Host).
  // Nếu origin khác nhau, Next coi rewrite là URL ngoài và proxy qua HTTP → vòng lặp redirect
  // (xảy ra ở production sau Nginx, Host = tên miền còn server bind 127.0.0.1).
  const res = NextResponse.rewrite(new URL(`${route.internalPath}${search}`, req.url))
  res.headers.set('Content-Language', route.locale)
  return res
}

export const config = {
  // Bỏ qua: Next nội bộ, API, admin Payload, media, file tĩnh (có đuôi), sitemap/robots
  matcher: ['/((?!_next/|api/|admin(?:/|$)|media/|next/|.*\\.[a-zA-Z0-9]{2,5}$).*)'],
}
