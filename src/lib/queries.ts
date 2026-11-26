import 'server-only'

import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload, type CollectionSlug, type Where } from 'payload'

import { archiveCutoff } from '@/lib/archive'
import { cacheTags } from '@/lib/cache-tags'
import type { Locale } from '@/lib/i18n/config'
import type {
  Campus,
  Category,
  Event,
  Faq,
  Footer,
  Header,
  Major,
  News,
  Page,
  Program,
  Research,
  SiteSetting,
  Testimonial,
} from '@/payload-types'

/**
 * Lớp truy vấn dữ liệu cho frontend.
 * - Luôn overrideAccess: false → khách chỉ thấy bản đã xuất bản (access publishedOrStaff).
 * - Cache bằng unstable_cache + tag theo collection; hook afterChange gọi revalidateTag.
 * - revalidate 1 giờ làm lưới an toàn cho các mốc thời gian (sự kiện qua ngày, tin vào lưu trữ).
 */

export const getPayloadClient = () => getPayload({ config })

const REVALIDATE_SECONDS = 3600
export const PAGE_SIZE = 12

function cached<A extends unknown[], R>(
  key: string,
  tags: string[],
  fn: (...args: A) => Promise<R>,
) {
  return unstable_cache(fn, [key], { tags, revalidate: REVALIDATE_SECONDS })
}

const col = cacheTags.collection

/** Điều kiện "đã có bản dịch" cho locale hiện tại (fallback tắt nên bản thiếu có slug null). */
const translated: Where = { slug: { exists: true } }

/** Mốc ngày (đầu ngày, UTC+7) — dùng làm khoá cache theo ngày */
export function todayKey(now: Date = new Date()): string {
  const vn = new Date(now.getTime() + 7 * 3600 * 1000)
  return vn.toISOString().slice(0, 10)
}

function startOfDayVN(key: string): Date {
  return new Date(`${key}T00:00:00+07:00`)
}

// ---------- Globals ----------

export const getHeader = cached('header', [cacheTags.global('header')], async (locale: Locale) => {
  const payload = await getPayloadClient()
  return (await payload.findGlobal({
    slug: 'header',
    locale,
    depth: 0,
    overrideAccess: false,
  })) as Header
})

export const getFooter = cached('footer', [cacheTags.global('footer')], async (locale: Locale) => {
  const payload = await getPayloadClient()
  return (await payload.findGlobal({
    slug: 'footer',
    locale,
    depth: 0,
    overrideAccess: false,
  })) as Footer
})

export const getSiteSettings = cached(
  'siteSettings',
  [cacheTags.global('siteSettings')],
  async (locale: Locale) => {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({
      slug: 'siteSettings',
      locale,
      depth: 1,
      overrideAccess: false,
    })) as SiteSetting
  },
)

// ---------- Pages ----------

export const getPage = cached(
  'page',
  [col('pages'), col('faqs'), col('testimonials')],
  async (locale: Locale, slug: string) => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'pages',
      locale,
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 2,
      overrideAccess: false,
    })
    return (docs[0] as Page | undefined) ?? null
  },
)

// ---------- Campuses ----------

export const getCampuses = cached('campuses', [col('campuses')], async (locale: Locale) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'campuses',
    locale,
    where: translated,
    sort: 'sortOrder',
    limit: 50,
    depth: 1,
    overrideAccess: false,
  })
  return docs as Campus[]
})

export const getCampus = cached(
  'campus',
  [col('campuses')],
  async (locale: Locale, slug: string) => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'campuses',
      locale,
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
      overrideAccess: false,
    })
    return (docs[0] as Campus | undefined) ?? null
  },
)

// ---------- Programs & majors ----------

export const getPrograms = cached('programs', [col('programs')], async (locale: Locale) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'programs',
    locale,
    where: translated,
    sort: 'sortOrder',
    limit: 50,
    depth: 1,
    overrideAccess: false,
  })
  return docs as Program[]
})

export const getProgram = cached(
  'program',
  [col('programs'), col('majors'), col('campuses'), col('faqs')],
  async (locale: Locale, slug: string) => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'programs',
      locale,
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 2,
      overrideAccess: false,
      joins: { majors: { limit: 50, sort: 'sortOrder' } },
    })
    return (docs[0] as Program | undefined) ?? null
  },
)

export const getMajors = cached(
  'majors',
  [col('majors'), col('programs')],
  async (locale: Locale) => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'majors',
      locale,
      where: translated,
      sort: 'sortOrder',
      limit: 100,
      depth: 1,
      overrideAccess: false,
    })
    return docs as Major[]
  },
)

export const getMajorsForProgram = cached(
  'majorsForProgram',
  [col('majors')],
  async (locale: Locale, programId: number) => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'majors',
      locale,
      where: { and: [translated, { program: { equals: programId } }] },
      sort: 'sortOrder',
      limit: 100,
      depth: 1,
      overrideAccess: false,
    })
    return docs as Major[]
  },
)

export const getMajor = cached(
  'major',
  [col('majors'), col('programs'), col('subjects')],
  async (locale: Locale, slug: string) => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'majors',
      locale,
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 2,
      overrideAccess: false,
    })
    return (docs[0] as Major | undefined) ?? null
  },
)

// ---------- News ----------

export type NewsQuery = {
  locale: Locale
  page?: number
  category?: string | null
  archived?: boolean
  day: string
}

export const getNewsPage = cached(
  'newsPage',
  [col('news'), col('categories')],
  async (q: NewsQuery) => {
    const payload = await getPayloadClient()
    const cutoff = archiveCutoff(startOfDayVN(q.day)).toISOString()
    const and: Where[] = [
      translated,
      q.archived
        ? { publishedAt: { less_than: cutoff } }
        : { publishedAt: { greater_than_equal: cutoff } },
    ]
    if (q.category) {
      const { docs } = await payload.find({
        collection: 'categories',
        locale: q.locale,
        where: { slug: { equals: q.category } },
        limit: 1,
        depth: 0,
      })
      const cat = docs[0]
      if (!cat) return null
      and.push({ categories: { contains: cat.id } })
    }
    const result = await payload.find({
      collection: 'news',
      locale: q.locale,
      where: { and },
      sort: '-publishedAt',
      limit: PAGE_SIZE,
      page: Math.max(1, q.page ?? 1),
      depth: 1,
      overrideAccess: false,
    })
    return { ...result, docs: result.docs as News[] }
  },
)

export const getLatestNews = cached(
  'latestNews',
  [col('news')],
  async (locale: Locale, limit: number, day: string) => {
    const payload = await getPayloadClient()
    const cutoff = archiveCutoff(startOfDayVN(day)).toISOString()
    const { docs } = await payload.find({
      collection: 'news',
      locale,
      where: { and: [translated, { publishedAt: { greater_than_equal: cutoff } }] },
      sort: '-publishedAt',
      limit,
      depth: 1,
      overrideAccess: false,
    })
    return docs as News[]
  },
)

export const getNewsItem = cached(
  'newsItem',
  [col('news'), col('categories')],
  async (locale: Locale, slug: string) => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'news',
      locale,
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
      overrideAccess: false,
    })
    return (docs[0] as News | undefined) ?? null
  },
)

export const getCategories = cached('categories', [col('categories')], async (locale: Locale) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'categories',
    locale,
    where: translated,
    sort: 'title',
    limit: 100,
    depth: 0,
    overrideAccess: false,
  })
  return docs as Category[]
})

// ---------- Events ----------

export type EventsQuery = {
  locale: Locale
  when: 'upcoming' | 'past'
  page?: number
  limit?: number
  day: string
}

export const getEventsPage = cached('eventsPage', [col('events')], async (q: EventsQuery) => {
  const payload = await getPayloadClient()
  const start = startOfDayVN(q.day).toISOString()
  const result = await payload.find({
    collection: 'events',
    locale: q.locale,
    where: {
      and: [
        translated,
        q.when === 'upcoming'
          ? { startAt: { greater_than_equal: start } }
          : { startAt: { less_than: start } },
      ],
    },
    sort: q.when === 'upcoming' ? 'startAt' : '-startAt',
    limit: q.limit ?? PAGE_SIZE,
    page: Math.max(1, q.page ?? 1),
    depth: 1,
    overrideAccess: false,
  })
  return { ...result, docs: result.docs as Event[] }
})

export const getEvent = cached(
  'event',
  [col('events'), col('campuses')],
  async (locale: Locale, slug: string) => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'events',
      locale,
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
      overrideAccess: false,
    })
    return (docs[0] as Event | undefined) ?? null
  },
)

// ---------- Research ----------

export const getResearchPage = cached(
  'researchPage',
  [col('research')],
  async (locale: Locale, page: number) => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'research',
      locale,
      where: translated,
      sort: '-publishedAt',
      limit: PAGE_SIZE,
      page: Math.max(1, page),
      depth: 0,
      overrideAccess: false,
    })
    return { ...result, docs: result.docs as Research[] }
  },
)

export const getResearchItem = cached(
  'researchItem',
  [col('research')],
  async (locale: Locale, slug: string) => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'research',
      locale,
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: false,
    })
    return (docs[0] as Research | undefined) ?? null
  },
)

// ---------- Testimonials / FAQ ----------

export const getLatestTestimonials = cached(
  'testimonials',
  [col('testimonials')],
  async (locale: Locale, limit: number) => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'testimonials',
      locale,
      where: { quote: { exists: true } },
      sort: '-createdAt',
      limit,
      depth: 1,
      overrideAccess: false,
    })
    return docs as Testimonial[]
  },
)

export const getFaqsByGroup = cached(
  'faqsByGroup',
  [col('faqs')],
  async (locale: Locale, group: string) => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'faqs',
      locale,
      where: { and: [{ group: { equals: group } }, { question: { exists: true } }] },
      sort: 'sortOrder',
      limit: 30,
      depth: 0,
      overrideAccess: false,
    })
    return docs as Faq[]
  },
)

// ---------- Alternates (hreflang + chuyển ngôn ngữ) ----------

/** Slug của một tài liệu ở mọi locale: { vi: 'abc', en: null } */
export function getLocalizedSlugs(collection: CollectionSlug, id: number) {
  return cached(
    `localizedSlugs:${collection}`,
    [col(collection)],
    fetchLocalizedSlugs,
  )(collection, id)
}

const fetchLocalizedSlugs = async (collection: CollectionSlug, id: number) => {
  const payload = await getPayloadClient()
  const doc = (await payload.findByID({
    collection,
    id,
    locale: 'all',
    depth: 0,
    overrideAccess: false,
    select: { slug: true },
  })) as unknown as { slug?: Partial<Record<Locale, string | null>> | string | null }
  const slug = doc.slug
  if (slug && typeof slug === 'object') return { vi: slug.vi ?? null, en: slug.en ?? null }
  return { vi: typeof slug === 'string' ? slug : null, en: null }
}

// ---------- Form options ----------

export type LeadFormOptions = {
  programs: { group: string; options: string[] }[]
  campuses: string[]
}

export const getLeadFormOptions = cached(
  'leadFormOptions',
  [col('programs'), col('majors'), col('campuses')],
  async (locale: Locale): Promise<LeadFormOptions> => {
    const [programs, majors, campuses] = await Promise.all([
      getPrograms(locale),
      getMajors(locale),
      getCampuses(locale),
    ])
    return {
      programs: programs.map((p) => ({
        group: p.title,
        options: [
          p.title,
          ...majors
            .filter((m) => (typeof m.program === 'object' ? m.program?.id : m.program) === p.id)
            .map((m) => `${p.title} — ${m.title}`),
        ],
      })),
      campuses: campuses.map((c) => c.name),
    }
  },
)
