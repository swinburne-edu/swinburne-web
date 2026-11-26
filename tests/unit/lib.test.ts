import { afterEach, describe, expect, it } from 'vitest'

import { archiveCutoff, isArchivedDate } from '@/lib/archive'
import {
  deserializeAttribution,
  parseAttribution,
  readCookie,
  resolveAttribution,
  serializeAttribution,
} from '@/lib/attribution'
import { docHref, pageHref, resolvePublicPath, sectionHref } from '@/lib/i18n/routes'
import { imageSource } from '@/lib/media'
import {
  buildRedirectMap,
  getRedirectMap,
  normalizePath,
  resetRedirectCache,
} from '@/lib/redirects'
import { buildLanguageAlternates, buildMetadata } from '@/lib/seo/metadata'
import { slugify } from '@/lib/slugify'
import { currentAcademicStartYear, isTuitionExpired, sortTuition } from '@/lib/tuition'
import type { Media } from '@/payload-types'

describe('slugify', () => {
  it('bỏ dấu tiếng Việt, đ → d', () => {
    expect(slugify('Đăng ký Tư vấn 2026!')).toBe('dang-ky-tu-van-2026')
    expect(slugify('Logistics và Quản lý chuỗi cung ứng')).toBe(
      'logistics-va-quan-ly-chuoi-cung-ung',
    )
    expect(slugify('  --Hà Nội – Hòa Lạc--  ')).toBe('ha-noi-hoa-lac')
  })
  it('cắt theo ranh giới từ khi quá dài', () => {
    const s = slugify('một hai ba bốn năm sáu bảy tám chín mười', 20)
    expect(s.length).toBeLessThanOrEqual(20)
    expect(s.endsWith('-')).toBe(false)
  })
})

describe('định tuyến song ngữ', () => {
  it('dựng URL công khai', () => {
    expect(sectionHref('vi', 'news', 'abc')).toBe('/tin-tuc/abc')
    expect(sectionHref('en', 'news', 'abc')).toBe('/en/news/abc')
    expect(sectionHref('vi', 'programs')).toBe('/chuong-trinh')
    expect(pageHref('vi', 'home')).toBe('/')
    expect(pageHref('en', 'home')).toBe('/en')
    expect(pageHref('en', 'about-us')).toBe('/en/about-us')
    expect(docHref('vi', 'campuses', 'da-nang')).toBe('/co-so/da-nang')
  })

  it.each([
    ['/', { kind: 'rewrite', locale: 'vi', internalPath: '/vi' }],
    ['/en', { kind: 'rewrite', locale: 'en', internalPath: '/en' }],
    ['/tin-tuc', { kind: 'rewrite', locale: 'vi', internalPath: '/vi/news' }],
    ['/tin-tuc/bai-a', { kind: 'rewrite', locale: 'vi', internalPath: '/vi/news/bai-a' }],
    ['/tin-tuc/luu-tru', { kind: 'rewrite', locale: 'vi', internalPath: '/vi/news/archive' }],
    ['/en/news/archive', { kind: 'rewrite', locale: 'en', internalPath: '/en/news/archive' }],
    ['/en/programs/mba', { kind: 'rewrite', locale: 'en', internalPath: '/en/programs/mba' }],
    ['/ve-chung-toi', { kind: 'rewrite', locale: 'vi', internalPath: '/vi/p/ve-chung-toi' }],
    // section tiếng Anh dưới URL tiếng Việt không được map → coi là trang (404 nếu không có)
    ['/news/abc', { kind: 'rewrite', locale: 'vi', internalPath: '/vi/p/news/abc' }],
    // quá nhiều cấp → trang (404)
    ['/tin-tuc/a/b', { kind: 'rewrite', locale: 'vi', internalPath: '/vi/p/tin-tuc/a/b' }],
    ['/vi/tin-tuc', { kind: 'redirect', location: '/tin-tuc' }],
    ['/home', { kind: 'redirect', location: '/' }],
    ['/en/home', { kind: 'redirect', location: '/en' }],
  ])('%s', (input, expected) => {
    expect(resolvePublicPath(input)).toEqual(expected)
  })
})

describe('lưu trữ 18 tháng', () => {
  const now = new Date('2026-11-25T00:00:00Z')
  it('mốc cắt = 18 tháng trước', () => {
    expect(archiveCutoff(now).toISOString().slice(0, 7)).toBe('2025-05')
  })
  it('phân loại bài cũ/mới', () => {
    expect(isArchivedDate('2025-01-01', now)).toBe(true)
    expect(isArchivedDate('2026-01-01', now)).toBe(false)
    expect(isArchivedDate(null, now)).toBe(false)
  })
})

describe('học phí theo năm học', () => {
  it('năm học bắt đầu từ tháng 9', () => {
    expect(currentAcademicStartYear(new Date('2026-11-25'))).toBe(2026)
    expect(currentAcademicStartYear(new Date('2026-05-01'))).toBe(2025)
  })
  it('năm cũ hết hiệu lực', () => {
    const now = new Date('2026-11-25')
    expect(isTuitionExpired('2025-2026', now)).toBe(true)
    expect(isTuitionExpired('2026-2027', now)).toBe(false)
    expect(isTuitionExpired('2027-2028', now)).toBe(false)
    expect(isTuitionExpired('không hợp lệ', now)).toBe(false)
  })
  it('sắp xếp năm mới nhất lên đầu', () => {
    const rows = sortTuition([
      { academicYear: '2024-2025', amount: 1 },
      { academicYear: '2026-2027', amount: 3 },
      { academicYear: '2025-2026', amount: 2 },
    ])
    expect(rows.map((r) => r.amount)).toEqual([3, 2, 1])
  })
})

describe('UTM / gclid / fbclid', () => {
  it('đọc tham số quảng cáo, bỏ qua URL không có', () => {
    const a = parseAttribution(
      new URLSearchParams('utm_source=google&utm_medium=cpc&gclid=G1&x=1'),
      new Date('2026-01-01'),
    )
    expect(a).toEqual({
      utm: { source: 'google', medium: 'cpc' },
      gclid: 'G1',
      ts: '2026-01-01T00:00:00.000Z',
    })
    expect(parseAttribution(new URLSearchParams('q=abc'))).toBeNull()
  })
  it('cookie: serialize ↔ deserialize, chống dữ liệu hỏng', () => {
    const a = { utm: { source: 'fb' }, fbclid: 'F1', ts: 'x' }
    const raw = serializeAttribution(a)
    expect(deserializeAttribution(raw)).toEqual(a)
    expect(deserializeAttribution('%7Bhong')).toBeNull()
    expect(readCookie(`a=1; swin_attr=${raw}; b=2`, 'swin_attr')).toBe(raw)
  })
  it('tham số URL hiện tại ưu tiên hơn cookie', () => {
    expect(resolveAttribution({ gclid: 'new' }, { gclid: 'old' })).toEqual({ gclid: 'new' })
    expect(resolveAttribution(null, { gclid: 'old' })).toEqual({ gclid: 'old' })
    expect(resolveAttribution(null, null)).toEqual({})
  })
})

describe('redirects', () => {
  afterEach(() => resetRedirectCache())

  it('chuẩn hoá path', () => {
    expect(normalizePath('/2021/05/Bai-Viet/')).toBe('/2021/05/bai-viet')
    expect(normalizePath('https://swinburne-vn.edu.vn/a/b/?x=1')).toBe('/a/b')
    expect(normalizePath('a//b')).toBe('/a/b')
    expect(normalizePath('/tin-t%E1%BB%A9c')).toBe('/tin-tức')
  })

  it('dựng bảng: reference + custom, bỏ redirect vòng', () => {
    const map = buildRedirectMap([
      { from: '/old/', to: { type: 'custom', url: '/new' }, type: '301' },
      {
        from: '/p',
        to: { type: 'reference', reference: { relationTo: 'news', value: { slug: 'bai-a' } } },
      },
      { from: '/loop', to: { type: 'custom', url: '/loop/' } },
      { from: '/tmp', to: { type: 'custom', url: 'https://example.test/x' }, type: '302' },
    ])
    expect(map.get('/old')).toEqual({ location: '/new', status: 301 })
    expect(map.get('/p')).toEqual({ location: '/tin-tuc/bai-a', status: 301 })
    expect(map.has('/loop')).toBe(false)
    expect(map.get('/tmp')!.status).toBe(302)
  })

  it('cache theo TTL, chỉ nạp lại khi hết hạn', async () => {
    let calls = 0
    let t = 0
    const loader = async () => {
      calls++
      return [{ from: '/a', to: { type: 'custom', url: '/b' } }]
    }
    await getRedirectMap(loader, 1000, () => t)
    t = 500
    await getRedirectMap(loader, 1000, () => t)
    expect(calls).toBe(1)
    t = 1500
    await getRedirectMap(loader, 1000, () => t)
    expect(calls).toBe(2)
  })
})

describe('media srcset', () => {
  const media = {
    id: 1,
    alt: 'Ảnh',
    filename: 'a.webp',
    mimeType: 'image/webp',
    width: 1600,
    height: 1000,
    sizes: {
      thumb: { filename: 'a-400x300.webp', width: 400, height: 300 },
      card: { filename: 'a-800x600.webp', width: 800, height: 600 },
      content: { filename: 'a-1200x750.webp', width: 1200, height: 750 },
      hero: { filename: 'a-1920x800.webp', width: 1920, height: 800 },
    },
    updatedAt: '',
    createdAt: '',
  } as Media

  it('srcset chỉ gồm các size cùng tỉ lệ', () => {
    const card = imageSource(media, 'card')!
    expect(card.src).toBe('/media/a-800x600.webp')
    expect(card.srcSet).toBe('/media/a-400x300.webp 400w, /media/a-800x600.webp 800w')
    const content = imageSource(media, 'content')!
    expect(content.srcSet).toBe('/media/a-1200x750.webp 1200w, /media/a.webp 1600w')
  })
  it('SVG/PDF dùng file gốc, không srcset', () => {
    const svg = imageSource({
      ...media,
      mimeType: 'image/svg+xml',
      filename: 'logo.svg',
      sizes: {},
    } as Media)!
    expect(svg).toMatchObject({ src: '/media/logo.svg' })
    expect(svg.srcSet).toBeUndefined()
  })
})

describe('metadata', () => {
  it('hreflang chỉ khi có đủ 2 bản dịch', () => {
    expect(buildLanguageAlternates({ vi: '/a', en: null })).toBeUndefined()
    expect(buildLanguageAlternates({ vi: '/a', en: '/en/a' })).toEqual({
      vi: 'http://localhost:3000/a',
      en: 'http://localhost:3000/en/a',
      'x-default': 'http://localhost:3000/a',
    })
  })
  it('ưu tiên trường seo, canonical tuyệt đối, noindex theo cờ', () => {
    const m = buildMetadata({
      locale: 'vi',
      title: 'Tiêu đề',
      description: 'Mô tả',
      path: '/tin-tuc/a',
      meta: { title: 'SEO title', description: 'SEO desc', noindex: true },
      siteName: 'Swin',
    })
    expect(m.title).toEqual({ absolute: 'SEO title' })
    expect(m.description).toBe('SEO desc')
    expect(m.alternates?.canonical).toBe('http://localhost:3000/tin-tuc/a')
    expect(m.robots).toEqual({ index: false, follow: false })
  })
})
