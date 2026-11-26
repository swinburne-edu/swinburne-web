/**
 * Mock CRM Laravel để test local (Windows/Ubuntu): pnpm mock-crm
 *
 *   POST /api/leads     nhận lead (cần Authorization: Bearer <CRM_API_TOKEN>, Idempotency-Key)
 *   GET  /api/leads     xem các lead đã nhận
 *   GET  /health        kiểm tra sống
 *
 * Biến môi trường:
 *   MOCK_CRM_PORT=4010          cổng
 *   MOCK_CRM_FAIL_RATE=0        tỉ lệ trả 503 ngẫu nhiên (0–1) để thử retry
 *   MOCK_CRM_DELAY_MS=0         trễ phản hồi (đặt > 5000 để thử timeout)
 */
import 'dotenv/config'

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

const port = Number(process.env.MOCK_CRM_PORT || 4010)
const token = process.env.CRM_API_TOKEN || 'local-dev-token'
const failRate = Number(process.env.MOCK_CRM_FAIL_RATE || 0)
const delayMs = Number(process.env.MOCK_CRM_DELAY_MS || 0)

type Stored = { id: number; idempotencyKey: string; receivedAt: string; lead: unknown }
const leads: Stored[] = []
const byKey = new Map<string, Stored>()

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

const server = createServer(async (req, res) => {
  if (delayMs) await new Promise((r) => setTimeout(r, delayMs))
  const url = new URL(req.url ?? '/', `http://localhost:${port}`)

  if (url.pathname === '/health') return send(res, 200, { ok: true })

  if (url.pathname === '/api/leads' && req.method === 'GET') {
    return send(res, 200, { total: leads.length, leads })
  }

  if (url.pathname === '/api/leads' && req.method === 'POST') {
    if (req.headers.authorization !== `Bearer ${token}`)
      return send(res, 401, { error: 'unauthorized' })
    const key = req.headers['idempotency-key']
    if (typeof key !== 'string' || !key) return send(res, 422, { error: 'missing Idempotency-Key' })
    if (failRate > 0 && Math.random() < failRate)
      return send(res, 503, { error: 'random failure (mock)' })

    const existing = byKey.get(key)
    if (existing) return send(res, 200, { id: existing.id, duplicate: true })

    let lead: unknown
    try {
      lead = await readJson(req)
    } catch {
      return send(res, 400, { error: 'invalid json' })
    }
    const stored: Stored = {
      id: leads.length + 1,
      idempotencyKey: key,
      receivedAt: new Date().toISOString(),
      lead,
    }
    leads.push(stored)
    byKey.set(key, stored)
    console.log(`[mock-crm] lead #${stored.id}`, JSON.stringify(lead))
    return send(res, 201, { id: stored.id })
  }

  send(res, 404, { error: 'not found' })
})

server.listen(port, () => {
  console.log(
    `[mock-crm] http://localhost:${port}/api/leads (fail rate ${failRate}, delay ${delayMs}ms)`,
  )
})
