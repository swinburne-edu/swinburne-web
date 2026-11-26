/**
 * Kiểm tra môi trường phát triển (PROMPTS.md P0): pnpm check-env
 * Node 22, pnpm, kết nối PostgreSQL theo DATABASE_URL, các biến bắt buộc.
 */
import 'dotenv/config'

import { execSync } from 'node:child_process'

import pg from 'pg'

type Check = { name: string; ok: boolean; detail: string }
const checks: Check[] = []

const add = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail })

const major = Number(process.versions.node.split('.')[0])
add('Node.js 22', major === 22, `đang dùng ${process.version}`)

try {
  const v = execSync('pnpm -v', { encoding: 'utf8' }).trim()
  add('pnpm', true, `v${v}`)
} catch {
  add('pnpm', false, 'không tìm thấy — chạy "corepack enable"')
}

for (const key of ['DATABASE_URL', 'PAYLOAD_SECRET', 'NEXT_PUBLIC_SITE_URL', 'MEDIA_DIR']) {
  add(`env ${key}`, Boolean(process.env[key]), process.env[key] ? 'đã đặt' : 'thiếu trong .env')
}

async function main() {
  const url = process.env.DATABASE_URL
  if (url) {
    const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5000 })
    try {
      await client.connect()
      const { rows } = await client.query<{ version: string }>('select version()')
      const version = rows[0]?.version.split(' ').slice(0, 2).join(' ') ?? '?'
      add('PostgreSQL', true, version)
    } catch (err) {
      add('PostgreSQL', false, err instanceof Error ? err.message : String(err))
    } finally {
      await client.end().catch(() => undefined)
    }
  }

  const width = Math.max(...checks.map((c) => c.name.length))
  for (const c of checks) console.log(`${c.ok ? '✔' : '✘'} ${c.name.padEnd(width)}  ${c.detail}`)
  const failed = checks.filter((c) => !c.ok).length
  console.log(failed ? `\n${failed} mục chưa đạt.` : '\nMôi trường sẵn sàng.')
  process.exit(failed ? 1 : 0)
}

void main()
