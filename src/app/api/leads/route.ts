import config from '@payload-config'
import { REST_DELETE, REST_GET, REST_OPTIONS, REST_PATCH } from '@payloadcms/next/routes'
import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'

import { getCrmClient } from '@/lib/crm'
import { handleLeadSubmission } from '@/lib/leads/handler'
import { clientIp, createRateLimiter } from '@/lib/rate-limit'
import { createTurnstileVerifier, resolveTurnstileSecret } from '@/lib/turnstile'

/**
 * POST /api/leads — nhận form đăng ký tư vấn (CLAUDE.md mục 7).
 * Route này "đè" REST POST mặc định của collection leads (vốn bị chặn bởi access create: nobody).
 * Các method khác (admin xem/sửa/xoá lead qua REST) chuyển lại cho Payload.
 */

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 10 * 1024
const limiter = createRateLimiter(5, 60_000)

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers)
  if (!limiter.check(ip ?? 'unknown')) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': '60' } },
    )
  }

  const text = await req.text()
  if (text.length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: 'payload_too_large' }, { status: 413 })
  }
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  try {
    const result = await handleLeadSubmission(body, ip, {
      payload,
      crm: getCrmClient(),
      verifyTurnstile: createTurnstileVerifier(resolveTurnstileSecret()),
    })
    return NextResponse.json(result.body, { status: result.status })
  } catch (err) {
    payload.logger.error({ err }, 'POST /api/leads thất bại')
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}

const slugParams = () => ({ params: Promise.resolve({ slug: ['leads'] }) })
const restGet = REST_GET(config)
const restPatch = REST_PATCH(config)
const restDelete = REST_DELETE(config)
const restOptions = REST_OPTIONS(config)

export const GET = (req: Request) => restGet(req, slugParams())
export const PATCH = (req: Request) => restPatch(req, slugParams())
export const DELETE = (req: Request) => restDelete(req, slugParams())
export const OPTIONS = (req: Request) => restOptions(req, slugParams())
