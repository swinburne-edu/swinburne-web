/**
 * Test tích hợp collection media (PROMPTS.md B2) — chạy trên DB riêng TEST_DATABASE_URL.
 * JPG/PNG → file gốc + 4 size đều .webp, rộng tối đa 2560. SVG/PDF giữ nguyên.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import type { Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

sharp.cache(false)

const testDb = process.env.TEST_DATABASE_URL
const tmpMedia = fs.mkdtempSync(path.join(os.tmpdir(), 'swin-media-'))

let payload: Payload

describe.skipIf(!testDb)('media upload', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = testDb
    process.env.MEDIA_DIR = tmpMedia
    const { getPayload } = await import('payload')
    const { default: config } = await import('@/payload.config')
    const { migrations } = await import('@/migrations')
    payload = await getPayload({ config })
    // Truyền migration đã import (Node không tự nạp file .ts trong thư mục migrations)
    type MigrateArgs = NonNullable<Parameters<Payload['db']['migrate']>[0]>
    await payload.db.migrate({ migrations: migrations as unknown as MigrateArgs['migrations'] })
  })

  afterAll(async () => {
    if (payload) {
      await payload.delete({
        collection: 'media',
        where: { id: { exists: true } },
        overrideAccess: true,
      })
      await payload.db.destroy?.()
    }
    try {
      // Windows: sharp có thể còn giữ handle file một lúc → thử lại vài lần, không làm fail test
      fs.rmSync(tmpMedia, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    } catch {
      // thư mục tạm của hệ điều hành, sẽ được dọn sau
    }
  })

  async function upload(name: string, data: Buffer, mimetype: string) {
    return payload.create({
      collection: 'media',
      data: { alt: `Test ${name}` },
      file: { data, mimetype, name, size: data.length },
      overrideAccess: true,
    })
  }

  const raster = (format: 'jpeg' | 'png', width: number, height: number) =>
    sharp({ create: { width, height, channels: 3, background: '#d42027' } })
      [format]()
      .toBuffer()

  it.each([
    ['photo.jpg', 'jpeg', 'image/jpeg'],
    ['graphic.png', 'png', 'image/png'],
  ] as const)('%s → webp, đủ 4 size, rộng ≤ 2560', async (name, format, mimetype) => {
    const doc = await upload(name, await raster(format, 3200, 2000), mimetype)
    expect(doc.mimeType).toBe('image/webp')
    expect(doc.filename).toMatch(/\.webp$/)
    expect(doc.width).toBe(2560)

    const meta = await sharp(path.join(tmpMedia, doc.filename!)).metadata()
    expect(meta.format).toBe('webp')
    expect(meta.width).toBeLessThanOrEqual(2560)
    expect(meta.exif).toBeUndefined()

    const expected = {
      thumb: [400, 300],
      card: [800, 600],
      content: [1200, 750],
      hero: [1920, 800],
    } as const
    for (const [size, [w, h]] of Object.entries(expected)) {
      const s = doc.sizes?.[size as keyof typeof expected]
      expect(s?.filename, `size ${size}`).toMatch(/\.webp$/)
      expect(s?.mimeType).toBe('image/webp')
      expect(s?.width).toBe(w)
      expect(s?.height).toBe(h)
      const sm = await sharp(path.join(tmpMedia, s!.filename!)).metadata()
      expect(sm.format).toBe('webp')
    }
  })

  it('ảnh nhỏ không bị phóng to', async () => {
    const doc = await upload('small.jpg', await raster('jpeg', 640, 480), 'image/jpeg')
    expect(doc.width).toBe(640)
    expect(doc.mimeType).toBe('image/webp')
  })

  it('SVG giữ nguyên định dạng', async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>',
    )
    const doc = await upload('logo.svg', svg, 'image/svg+xml')
    expect(doc.mimeType).toBe('image/svg+xml')
    expect(doc.filename).toMatch(/\.svg$/)
  })

  it('PDF giữ nguyên định dạng', async () => {
    // PDF tối giản hợp lệ (Payload kiểm tra header, xref và %%EOF)
    const objs = [
      '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n',
      '2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\n',
    ]
    let body = '%PDF-1.4\n'
    const offsets: number[] = []
    for (const o of objs) {
      offsets.push(body.length)
      body += o
    }
    const xrefAt = body.length
    body += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
    body += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
    body += `trailer<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xrefAt}\n%%EOF\n`
    const pdf = Buffer.from(body, 'latin1')
    const doc = await upload('brochure.pdf', pdf, 'application/pdf')
    expect(doc.mimeType).toBe('application/pdf')
    expect(doc.filename).toMatch(/\.pdf$/)
    expect(fs.existsSync(path.join(tmpMedia, doc.filename!))).toBe(true)
  })
})
