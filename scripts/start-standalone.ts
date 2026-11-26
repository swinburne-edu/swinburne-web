/**
 * Chạy thử bản build standalone ở local giống production: pnpm build && pnpm start:standalone
 * (chép .next/static + public vào .next/standalone, nạp .env, MEDIA_DIR tuyệt đối).
 */
import 'dotenv/config'

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { TURNSTILE_TEST_SECRET, TURNSTILE_TEST_SITE_KEY } from '../src/lib/turnstile'

const root = process.cwd()
const standalone = path.join(root, '.next', 'standalone')

if (!fs.existsSync(path.join(standalone, 'server.js'))) {
  console.error('Chưa có bản build standalone. Chạy "pnpm build" trước.')
  process.exit(1)
}

fs.cpSync(path.join(root, '.next', 'static'), path.join(standalone, '.next', 'static'), {
  recursive: true,
})
if (fs.existsSync(path.join(root, 'public'))) {
  fs.cpSync(path.join(root, 'public'), path.join(standalone, 'public'), { recursive: true })
}

const port = process.env.PORT || '3000'
const child = spawn(process.execPath, ['server.js'], {
  cwd: standalone,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: port,
    // Bind "localhost" (không dùng 127.0.0.1): Next dựng URL cho proxy.ts bằng "localhost";
    // nếu bind bằng IP, rewrite bị coi là URL ngoài → vòng lặp redirect.
    HOSTNAME: 'localhost',
    MEDIA_DIR: path.resolve(root, process.env.MEDIA_DIR || 'media'),
    // Chạy thử local: production bắt buộc Turnstile → dùng test key luôn-pass của Cloudflare nếu chưa đặt
    TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY || TURNSTILE_TEST_SITE_KEY,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY || TURNSTILE_TEST_SECRET,
  },
})
child.on('exit', (code) => process.exit(code ?? 0))
