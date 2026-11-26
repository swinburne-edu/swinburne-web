import { describe, expect, it } from 'vitest'

import {
  breadcrumbJsonLd,
  courseJsonLd,
  eventJsonLd,
  faqPageJsonLd,
  newsArticleJsonLd,
  organizationJsonLd,
  serializeJsonLd,
} from '@/lib/seo/jsonld'
import type { Campus, Event, Faq, News, Program } from '@/payload-types'

import { lexical } from '../../scripts/seed/lexical'

const campus = (name: string, address: string, phone: string): Campus =>
  ({
    id: 1,
    name,
    address,
    city: 'Hà Nội',
    phone,
    slug: 'x',
    updatedAt: '',
    createdAt: '',
  }) as Campus

// 5 cơ sở như dữ liệu seed (CLAUDE.md mục 5)
const campuses: Campus[] = [
  campus('Hà Nội', 'Số 80 Duy Tân, Phường Cầu Giấy, TP. Hà Nội', '0939 403 555'),
  campus('Hà Nội – Hòa Lạc', 'Global Education Space, Tòa nhà Zeta, Đại học FPT', '0939 403 555'),
  campus('Đà Nẵng', 'Lô 1+2-A14-16 Khu Công Viên Bắc đài tưởng niệm', '0798 210 555'),
  campus('TP.HCM', 'A35 Bạch Đằng, Phường Tân Sơn Hòa', '0387 148 555'),
  campus('Cần Thơ', 'Số 600 Nguyễn Văn Cừ, Phường An Bình', '0348 766 555'),
]

const org = {
  name: 'Swinburne Việt Nam',
  url: 'https://swinburne-vn.edu.vn',
  logoUrl: 'https://swinburne-vn.edu.vn/media/logo.webp',
}

describe('organizationJsonLd', () => {
  it('CollegeOrUniversity kèm đủ 5 cơ sở lấy từ dữ liệu, không hard-code', () => {
    const ld = organizationJsonLd(org, campuses)
    expect(ld['@type']).toBe('CollegeOrUniversity')
    expect(ld['@context']).toBe('https://schema.org')
    const locations = ld.location as { address: { streetAddress: string } }[]
    expect(locations).toHaveLength(5)
    expect(locations[0]!.address.streetAddress).toBe('Số 80 Duy Tân, Phường Cầu Giấy, TP. Hà Nội')
    expect((ld.contactPoint as unknown[]).length).toBe(5)
    expect(ld.parentOrganization).toMatchObject({ name: 'Swinburne University of Technology' })
  })
})

describe('courseJsonLd', () => {
  const program = {
    id: 1,
    title: 'Chương trình Cử nhân',
    slug: 'cu-nhan',
    level: 'bachelor',
    summary: 'Tóm tắt',
    duration: '3 năm',
    campuses: [campuses[0], campuses[3]],
    tuitionByYear: [
      { academicYear: '2025-2026', amount: 100, currency: 'VND' },
      { academicYear: '2026-2027', amount: 110, currency: 'VND' },
    ],
    updatedAt: '',
    createdAt: '',
  } as unknown as Program

  it('chỉ đưa học phí năm học còn hiệu lực vào offers', () => {
    const ld = courseJsonLd({
      program,
      url: 'https://x/chuong-trinh/cu-nhan',
      org,
      locale: 'vi',
      now: new Date('2026-11-25'),
    })
    expect(ld['@type']).toBe('Course')
    expect(ld.provider).toMatchObject({ '@type': 'CollegeOrUniversity', name: org.name })
    const offers = ld.offers as { price: number }[]
    expect(offers).toHaveLength(1)
    expect(offers[0]!.price).toBe(110)
    expect((ld.hasCourseInstance as unknown[]).length).toBe(2)
  })
})

describe('eventJsonLd', () => {
  it('Event có startDate, location từ cơ sở', () => {
    const event = {
      id: 1,
      title: 'Ngày hội tư vấn',
      slug: 'ngay-hoi',
      startAt: '2026-12-05T02:00:00.000Z',
      endAt: '2026-12-05T05:00:00.000Z',
      location: 'Hội trường',
      campus: campuses[2],
      content: lexical(['Nội dung sự kiện']),
      updatedAt: '',
      createdAt: '',
    } as unknown as Event
    const ld = eventJsonLd({ event, url: 'https://x/su-kien/ngay-hoi', org })
    expect(ld).toMatchObject({
      '@type': 'Event',
      startDate: '2026-12-05T02:00:00.000Z',
      description: 'Nội dung sự kiện',
      location: { '@type': 'Place', name: 'Hội trường' },
    })
    expect((ld.location as { address: { streetAddress: string } }).address.streetAddress).toContain(
      'Lô 1+2',
    )
  })
})

describe('newsArticleJsonLd', () => {
  it('cắt headline dài quá 110 ký tự', () => {
    const news = {
      id: 1,
      title: 'A'.repeat(150),
      slug: 'a',
      publishedAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      createdAt: '',
    } as News
    const ld = newsArticleJsonLd({ news, url: 'https://x/tin-tuc/a', org, imageUrl: null })
    expect((ld.headline as string).length).toBeLessThanOrEqual(110)
    expect(ld.datePublished).toBe('2026-01-01T00:00:00.000Z')
    expect(ld).not.toHaveProperty('image')
    expect(ld.publisher).toMatchObject({ logo: { url: org.logoUrl } })
  })
})

describe('faqPageJsonLd', () => {
  it('chuyển câu trả lời rich text thành văn bản; bỏ câu hỏi rỗng', () => {
    const faqs = [
      { question: 'Hỏi 1?', answer: lexical(['Đáp 1']) },
      { question: 'Hỏi 2?', answer: lexical([]) },
    ] as Pick<Faq, 'question' | 'answer'>[]
    const ld = faqPageJsonLd(faqs)!
    expect(ld['@type']).toBe('FAQPage')
    expect(ld.mainEntity).toEqual([
      { '@type': 'Question', name: 'Hỏi 1?', acceptedAnswer: { '@type': 'Answer', text: 'Đáp 1' } },
    ])
    expect(faqPageJsonLd([])).toBeNull()
  })
})

describe('breadcrumbJsonLd + serializeJsonLd', () => {
  it('đánh số vị trí và escape ký tự nguy hiểm', () => {
    const ld = breadcrumbJsonLd([
      { name: 'Trang chủ', url: 'https://x/' },
      { name: '</script><b>', url: 'https://x/a' },
    ])
    expect((ld.itemListElement as { position: number }[]).map((i) => i.position)).toEqual([1, 2])
    const s = serializeJsonLd(ld)
    expect(s).not.toContain('</script>')
    expect(JSON.parse(s)).toEqual(ld)
  })
})
