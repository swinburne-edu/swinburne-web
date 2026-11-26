import type { Campus, Event, Faq, News, Program } from '@/payload-types'
import type { Locale } from '@/lib/i18n/config'
import { lexicalToPlainText } from '@/lib/lexical-text'
import { isTuitionExpired } from '@/lib/tuition'

/**
 * JSON-LD sinh từ dữ liệu CMS (CLAUDE.md mục 9). Không hard-code địa chỉ: luôn lấy từ `campuses`.
 * Hàm thuần — dễ test, không truy vấn DB.
 */

export type JsonLd = Record<string, unknown>

export type OrgInfo = {
  name: string
  url: string
  description?: string | null
  logoUrl?: string | null
  email?: string | null
  sameAs?: string[]
}

const PARENT_ORG = {
  '@type': 'CollegeOrUniversity',
  name: 'Swinburne University of Technology',
  url: 'https://www.swinburne.edu.au',
}

function compact<T extends JsonLd>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0),
    ),
  ) as T
}

export function campusPlace(
  campus: Pick<Campus, 'name' | 'address' | 'city' | 'phone' | 'email' | 'mapUrl'>,
): JsonLd {
  return compact({
    '@type': 'Place',
    name: campus.name,
    telephone: campus.phone ?? undefined,
    hasMap: campus.mapUrl ?? undefined,
    address: compact({
      '@type': 'PostalAddress',
      streetAddress: campus.address,
      addressLocality: campus.city,
      addressCountry: 'VN',
    }),
  })
}

export function organizationJsonLd(org: OrgInfo, campuses: Campus[]): JsonLd {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    '@id': `${org.url}/#organization`,
    name: org.name,
    url: org.url,
    description: org.description ?? undefined,
    logo: org.logoUrl ?? undefined,
    email: org.email ?? undefined,
    sameAs: org.sameAs,
    parentOrganization: PARENT_ORG,
    location: campuses.map(campusPlace),
    contactPoint: campuses
      .filter((c) => c.phone)
      .map((c) =>
        compact({
          '@type': 'ContactPoint',
          contactType: 'admissions',
          telephone: c.phone,
          areaServed: c.city,
          availableLanguage: ['vi', 'en'],
        }),
      ),
  })
}

export function courseJsonLd(args: {
  program: Program
  url: string
  org: OrgInfo
  locale: Locale
  now?: Date
}): JsonLd {
  const { program, url, org } = args
  const campuses = (program.campuses ?? []).filter(
    (c): c is Campus => typeof c === 'object' && c !== null,
  )
  const offers = (program.tuitionByYear ?? [])
    .filter((t) => !isTuitionExpired(t.academicYear, args.now))
    .map((t) =>
      compact({
        '@type': 'Offer',
        category: 'Tuition',
        price: t.amount,
        priceCurrency: t.currency ?? 'VND',
        description: `${t.academicYear}${t.note ? ` — ${t.note}` : ''}`,
      }),
    )

  return compact({
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${url}#course`,
    name: program.title,
    description: program.summary || lexicalToPlainText(program.body, 300) || program.title,
    url,
    inLanguage: args.locale,
    educationalLevel: program.level === 'master' ? 'Postgraduate' : 'Undergraduate',
    educationalCredentialAwarded: program.level === 'master' ? 'Master degree' : 'Bachelor degree',
    provider: compact({
      '@type': 'CollegeOrUniversity',
      name: org.name,
      url: org.url,
      sameAs: org.url,
    }),
    offers,
    hasCourseInstance: campuses.map((c) =>
      compact({
        '@type': 'CourseInstance',
        courseMode: 'Onsite',
        location: campusPlace(c),
        courseWorkload: program.duration ?? undefined,
      }),
    ),
  })
}

export function eventJsonLd(args: {
  event: Event
  url: string
  imageUrl?: string | null
  org: OrgInfo
}): JsonLd {
  const { event, url, org } = args
  const campus = typeof event.campus === 'object' && event.campus ? event.campus : null
  const location = campus
    ? { ...campusPlace(campus), name: event.location || campus.name }
    : compact({
        '@type': 'Place',
        name: event.location || org.name,
        address: event.location || undefined,
      })

  return compact({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: event.startAt,
    endDate: event.endAt ?? undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    description: lexicalToPlainText(event.content, 300) || event.title,
    image: args.imageUrl ? [args.imageUrl] : undefined,
    url,
    location,
    organizer: compact({ '@type': 'Organization', name: org.name, url: org.url }),
  })
}

export function newsArticleJsonLd(args: {
  news: News
  url: string
  imageUrl?: string | null
  org: OrgInfo
}): JsonLd {
  const { news, url, org } = args
  const headline = news.title.length > 110 ? `${news.title.slice(0, 107)}…` : news.title
  return compact({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline,
    description: news.excerpt ?? undefined,
    image: args.imageUrl ? [args.imageUrl] : undefined,
    datePublished: news.publishedAt ?? news.createdAt,
    dateModified: news.updatedAt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@type': 'Organization', name: org.name, url: org.url },
    publisher: compact({
      '@type': 'Organization',
      name: org.name,
      logo: org.logoUrl ? { '@type': 'ImageObject', url: org.logoUrl } : undefined,
    }),
  })
}

export function faqPageJsonLd(faqs: Pick<Faq, 'question' | 'answer'>[]): JsonLd | null {
  const items = faqs
    .map((f) => ({ q: f.question, a: lexicalToPlainText(f.answer) }))
    .filter((f) => f.q && f.a)
  if (!items.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

export type Crumb = { name: string; url: string }

export function breadcrumbJsonLd(items: Crumb[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/** Chuỗi an toàn để chèn vào <script type="application/ld+json"> */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}
