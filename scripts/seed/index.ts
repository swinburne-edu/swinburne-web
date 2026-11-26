/**
 * Dữ liệu mẫu cho phát triển & test giao diện (PROMPTS.md B4).
 *   pnpm seed           — nạp thêm (bỏ qua nếu đã có dữ liệu)
 *   pnpm seed --reset   — xoá sạch nội dung rồi nạp lại
 *
 * Mọi nội dung đều là MẪU. Học phí là số giả có nhãn "mẫu", không phải học phí thật.
 * Tài khoản admin: chỉ tạo khi đặt SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD trong .env;
 * nếu không, tạo admin đầu tiên tại http://localhost:3000/admin.
 */
import 'dotenv/config'

import { getPayload, type CollectionSlug, type Payload, type RequestContext } from 'payload'

import config from '../../src/payload.config'
import { slugify } from '../../src/lib/slugify'
import type { Campus, Category, Faq, Media, Program } from '../../src/payload-types'
import { makeSampleImage } from './images'
import { lexical } from './lexical'

const context: RequestContext = { disableRevalidate: true }
const reset = process.argv.includes('--reset')

const DAY = 24 * 3600 * 1000
const daysFromNow = (d: number) => new Date(Date.now() + d * DAY).toISOString()
const monthsAgo = (m: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() - m)
  return d.toISOString()
}

const RESET_ORDER: CollectionSlug[] = [
  'redirects',
  'pages',
  'news',
  'events',
  'research',
  'people',
  'testimonials',
  'majors',
  'programs',
  'faqs',
  'subjects',
  'campuses',
  'categories',
  'tags',
  'documents',
  'leads',
  'payload-jobs',
  'media',
]

async function wipe(payload: Payload) {
  for (const collection of RESET_ORDER) {
    const res = await payload.delete({
      collection,
      where: { id: { exists: true } },
      overrideAccess: true,
      context,
    })
    payload.logger.info(`  xoá ${collection}: ${res.docs.length}`)
  }
}

let imageIndex = 0
async function image(payload: Payload, vi: string, en: string): Promise<Media> {
  const file = await makeSampleImage(vi, imageIndex++)
  const media = await payload.create({
    collection: 'media',
    data: { alt: vi },
    locale: 'vi',
    file: { ...file, name: `${slugify(en)}.jpg` },
    overrideAccess: true,
    context,
  })
  await payload.update({
    collection: 'media',
    id: media.id,
    data: { alt: en },
    locale: 'en',
    overrideAccess: true,
    context,
  })
  return media
}

/** Tạo tài liệu có bản vi (+ en nếu có) và xuất bản */
async function createLocalized<T extends { id: number }>(
  payload: Payload,
  collection: CollectionSlug,
  vi: Record<string, unknown>,
  en?: Record<string, unknown> | null,
): Promise<T> {
  // Có slug cố định → tắt tự sinh slug từ tiêu đề
  const fixed = (d: Record<string, unknown>) => ('slug' in d ? { ...d, generateSlug: false } : d)
  const doc = (await payload.create({
    collection,
    data: { ...fixed(vi), _status: 'published' } as never,
    locale: 'vi',
    draft: false,
    overrideAccess: true,
    context,
  })) as unknown as T
  if (en) {
    await payload.update({
      collection,
      id: doc.id,
      data: { ...fixed(en), _status: 'published' } as never,
      locale: 'en',
      draft: false,
      overrideAccess: true,
      context,
    })
  }
  return doc
}

// ---------------------------------------------------------------- dữ liệu

const CAMPUSES = [
  {
    vi: 'Hà Nội',
    en: 'Hanoi',
    city: 'Hà Nội',
    addressVi: 'Số 80 Duy Tân, Phường Cầu Giấy, TP. Hà Nội',
    addressEn: '80 Duy Tan, Cau Giay Ward, Hanoi',
    phone: '0939 403 555',
  },
  {
    vi: 'Hà Nội – Hòa Lạc',
    en: 'Hanoi – Hoa Lac',
    city: 'Hà Nội',
    addressVi:
      'Global Education Space, Tòa nhà Zeta, Đại học FPT, Khu CNC Hòa Lạc, Km29 Đại lộ Thăng Long',
    addressEn:
      'Global Education Space, Zeta Building, FPT University, Hoa Lac Hi-Tech Park, Km29 Thang Long Blvd',
    phone: '0939 403 555',
  },
  {
    vi: 'Đà Nẵng',
    en: 'Da Nang',
    city: 'Đà Nẵng',
    addressVi: 'Lô 1+2-A14-16 Khu Công Viên Bắc đài tưởng niệm, đường 2 tháng 9, Phường Hòa Cường',
    addressEn: 'Lot 1+2-A14-16, North Memorial Park area, 2 Thang 9 Street, Hoa Cuong Ward',
    phone: '0798 210 555',
  },
  {
    vi: 'TP.HCM',
    en: 'Ho Chi Minh City',
    city: 'TP. Hồ Chí Minh',
    addressVi: 'A35 Bạch Đằng, Phường Tân Sơn Hòa',
    addressEn: 'A35 Bach Dang, Tan Son Hoa Ward',
    phone: '0387 148 555',
  },
  {
    vi: 'Cần Thơ',
    en: 'Can Tho',
    city: 'Cần Thơ',
    addressVi: 'Số 600 Nguyễn Văn Cừ, Phường An Bình',
    addressEn: '600 Nguyen Van Cu, An Binh Ward',
    phone: '0348 766 555',
  },
]

const MAJORS: { vi: string; en: string; group: 'business' | 'it' | 'media' }[] = [
  { vi: 'Phân tích kinh doanh', en: 'Business Analytics', group: 'business' },
  { vi: 'Marketing', en: 'Marketing', group: 'business' },
  { vi: 'Kinh doanh quốc tế', en: 'International Business', group: 'business' },
  { vi: 'Quản trị kinh doanh', en: 'Management', group: 'business' },
  { vi: 'Tài chính', en: 'Finance', group: 'business' },
  {
    vi: 'Logistics và Quản lý chuỗi cung ứng',
    en: 'Logistics and Supply Chain Management',
    group: 'business',
  },
  { vi: 'Trí tuệ nhân tạo', en: 'Artificial Intelligence', group: 'it' },
  { vi: 'Khoa học dữ liệu', en: 'Data Science', group: 'it' },
  { vi: 'Phát triển phần mềm', en: 'Software Development', group: 'it' },
  { vi: 'IoT', en: 'Internet of Things', group: 'it' },
  { vi: 'An ninh mạng', en: 'Cybersecurity', group: 'it' },
  { vi: 'Quan hệ công chúng', en: 'Public Relations', group: 'media' },
  { vi: 'Quảng cáo', en: 'Advertising', group: 'media' },
  { vi: 'Truyền thông xã hội', en: 'Social Media', group: 'media' },
  { vi: 'Thiết kế truyền thông', en: 'Communication Design', group: 'media' },
  {
    vi: 'Thiết kế trải nghiệm và tương tác người dùng',
    en: 'User Experience and Interaction Design',
    group: 'media',
  },
]

const NEWS_TITLES: [string, string][] = [
  [
    'Swinburne Việt Nam khai giảng học kỳ mới (mẫu)',
    'Swinburne Vietnam welcomes new semester (sample)',
  ],
  [
    'Sinh viên CNTT đạt giải hackathon toàn quốc (mẫu)',
    'IT students win national hackathon (sample)',
  ],
  [
    'Hội thảo định hướng nghề nghiệp ngành Marketing (mẫu)',
    'Marketing career orientation workshop (sample)',
  ],
  ['Tuần lễ chào tân sinh viên tại Đà Nẵng (mẫu)', 'Orientation week in Da Nang (sample)'],
  [
    'Ký kết hợp tác với doanh nghiệp logistics (mẫu)',
    'Partnership signed with logistics company (sample)',
  ],
  [
    'Thông báo về chương trình học bổng toàn phần và bán phần dành cho tân sinh viên nhập học kỳ mùa thu, kèm hướng dẫn chi tiết hồ sơ, thời hạn nộp và các câu hỏi thường gặp của phụ huynh (mẫu — tiêu đề rất dài)',
    'Full and partial scholarship program for new students enrolling in the autumn intake, with detailed application guidance, deadlines and parents’ frequently asked questions (sample — very long title)',
  ],
  [
    'Sinh viên thiết kế trưng bày đồ án cuối kỳ (mẫu)',
    'Design students showcase final projects (sample)',
  ],
  [
    'Giảng viên Swinburne chia sẻ về AI tạo sinh (mẫu)',
    'Swinburne lecturer talks generative AI (sample)',
  ],
  ['Ngày hội việc làm 2026 (mẫu)', 'Career fair 2026 (sample)'],
  ['Chuyến trao đổi sinh viên tại Melbourne (mẫu)', 'Student exchange trip to Melbourne (sample)'],
  ['Cuộc thi ý tưởng khởi nghiệp sinh viên (mẫu)', 'Student startup idea competition (sample)'],
  ['Lễ tốt nghiệp tại TP.HCM (mẫu)', 'Graduation ceremony in Ho Chi Minh City (sample)'],
  ['CLB Truyền thông ra mắt podcast (mẫu)', 'Media club launches podcast (sample)'],
  [
    'Workshop an ninh mạng cho học sinh THPT (mẫu)',
    'Cybersecurity workshop for high school students (sample)',
  ],
  [
    'Sinh viên Cần Thơ tham gia dự án cộng đồng (mẫu)',
    'Can Tho students join community project (sample)',
  ],
  [
    'Cập nhật lịch tuyển sinh năm học mới (mẫu)',
    'Admissions calendar update for the new academic year (sample)',
  ],
  ['Phòng lab IoT mới tại Hòa Lạc (mẫu)', 'New IoT lab opens at Hoa Lac (sample)'],
  [
    'Talkshow: Ngành Tài chính trong kỷ nguyên số (mẫu)',
    'Talkshow: Finance in the digital era (sample)',
  ],
  [
    'Kinh nghiệm thực tập tại tập đoàn đa quốc gia (mẫu)',
    'Interning at a multinational corporation (sample)',
  ],
  [
    'Sinh viên đạt chứng chỉ quốc tế về dữ liệu (mẫu)',
    'Students earn international data certificates (sample)',
  ],
  ['Hội thao sinh viên toàn hệ thống (mẫu)', 'Inter-campus student sports day (sample)'],
  ['Trải nghiệm học tập chuẩn Úc (mẫu)', 'An Australian-standard learning experience (sample)'],
  // Từ đây: tin cũ hơn 18 tháng → mục Lưu trữ
  ['Khai trương cơ sở mới (mẫu — tin cũ)', 'New campus opening (sample — old news)'],
  ['Lễ tốt nghiệp khoá đầu tiên (mẫu — tin cũ)', 'First cohort graduation (sample — old news)'],
  [
    'Hội thảo quốc tế về giáo dục số (mẫu — tin cũ)',
    'International conference on digital education (sample — old news)',
  ],
  [
    'Sinh viên đạt giải thiết kế châu Á (mẫu — tin cũ)',
    'Students win Asian design award (sample — old news)',
  ],
  ['Ra mắt chương trình MBA (mẫu — tin cũ)', 'MBA program launch (sample — old news)'],
  ['Ngày hội tuyển sinh mùa hè (mẫu — tin cũ)', 'Summer admissions day (sample — old news)'],
  [
    'Hợp tác với trường THPT chuyên (mẫu — tin cũ)',
    'Partnership with specialised high schools (sample — old news)',
  ],
  [
    'Kỷ niệm 10 năm hợp tác Swinburne – FPT (mẫu — tin cũ)',
    '10 years of Swinburne – FPT partnership (sample — old news)',
  ],
]

const FAQS: { group: string; vi: [string, string]; en: [string, string] }[] = [
  {
    group: 'admissions',
    vi: [
      'Điều kiện xét tuyển chương trình Cử nhân là gì?',
      'Thông tin mẫu: tốt nghiệp THPT và đáp ứng yêu cầu tiếng Anh theo quy định từng năm.',
    ],
    en: [
      'What are the entry requirements for the Bachelor program?',
      'Sample answer: high school graduation and meeting the English requirement for the intake.',
    ],
  },
  {
    group: 'admissions',
    vi: [
      'Mỗi năm có mấy kỳ nhập học?',
      'Thông tin mẫu: có nhiều kỳ nhập học trong năm, xem lịch tuyển sinh để biết chi tiết.',
    ],
    en: [
      'How many intakes are there each year?',
      'Sample answer: there are several intakes per year; see the admissions calendar.',
    ],
  },
  {
    group: 'admissions',
    vi: [
      'Tôi chưa có IELTS thì có đăng ký được không?',
      'Thông tin mẫu: có, nhà trường có chương trình tiếng Anh dự bị.',
    ],
    en: [
      'Can I apply without an IELTS score?',
      'Sample answer: yes, an English preparation program is available.',
    ],
  },
  {
    group: 'tuition',
    vi: [
      'Học phí được đóng theo kỳ hay theo năm?',
      'Thông tin mẫu: học phí đóng theo kỳ. Số liệu cụ thể xem tại trang chương trình.',
    ],
    en: [
      'Is tuition paid per semester or per year?',
      'Sample answer: per semester. See each program page for figures.',
    ],
  },
  {
    group: 'tuition',
    vi: [
      'Có học bổng cho tân sinh viên không?',
      'Thông tin mẫu: có nhiều loại học bổng dựa trên thành tích học tập.',
    ],
    en: [
      'Are there scholarships for new students?',
      'Sample answer: several merit-based scholarships are available.',
    ],
  },
  {
    group: 'programs',
    vi: [
      'Bằng tốt nghiệp do trường nào cấp?',
      'Thông tin mẫu: bằng do Swinburne University of Technology (Úc) cấp.',
    ],
    en: [
      'Which university awards the degree?',
      'Sample answer: the degree is awarded by Swinburne University of Technology (Australia).',
    ],
  },
  {
    group: 'programs',
    vi: [
      'Tôi có thể chuyển tiếp sang Úc không?',
      'Thông tin mẫu: có lộ trình chuyển tiếp sang Swinburne Melbourne.',
    ],
    en: [
      'Can I transfer to Australia?',
      'Sample answer: a transfer pathway to Swinburne Melbourne is available.',
    ],
  },
  {
    group: 'programs',
    vi: [
      'Chương trình học bằng tiếng Anh hoàn toàn?',
      'Thông tin mẫu: có, toàn bộ chương trình giảng dạy bằng tiếng Anh.',
    ],
    en: [
      'Is the program taught entirely in English?',
      'Sample answer: yes, all teaching is in English.',
    ],
  },
  {
    group: 'student-life',
    vi: [
      'Sinh viên có những câu lạc bộ nào?',
      'Thông tin mẫu: nhiều CLB học thuật, nghệ thuật và thể thao.',
    ],
    en: ['What student clubs are there?', 'Sample answer: many academic, arts and sports clubs.'],
  },
  {
    group: 'student-life',
    vi: [
      'Trường có hỗ trợ tìm chỗ ở không?',
      'Thông tin mẫu: phòng Công tác sinh viên hỗ trợ thông tin nhà ở.',
    ],
    en: [
      'Does the school help with accommodation?',
      'Sample answer: Student Services provides housing information.',
    ],
  },
]

// ---------------------------------------------------------------- main

async function main() {
  const started = Date.now()
  const payload = await getPayload({ config })

  if (reset) {
    payload.logger.info('Xoá dữ liệu cũ…')
    await wipe(payload)
  } else {
    const { totalDocs } = await payload.count({ collection: 'campuses', overrideAccess: true })
    if (totalDocs > 0) {
      payload.logger.info('Đã có dữ liệu. Chạy "pnpm seed --reset" để nạp lại từ đầu.')
      process.exit(0)
    }
  }

  // Admin (tuỳ chọn)
  const adminEmail = process.env.SEED_ADMIN_EMAIL
  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  if (adminEmail && adminPassword) {
    const { totalDocs } = await payload.count({
      collection: 'users',
      where: { email: { equals: adminEmail } },
      overrideAccess: true,
    })
    if (!totalDocs) {
      await payload.create({
        collection: 'users',
        data: { email: adminEmail, password: adminPassword, name: 'Admin', roles: ['admin'] },
        overrideAccess: true,
        context,
      })
      payload.logger.info(`Đã tạo admin ${adminEmail}`)
    }
  }

  payload.logger.info('Tạo ảnh mẫu…')
  const heroImg = await image(
    payload,
    'Học chuẩn Úc tại Việt Nam',
    'Australian education in Vietnam',
  )
  const campusImgs = await Promise.all(
    CAMPUSES.map((c) => image(payload, `Cơ sở ${c.vi}`, `${c.en} campus`)),
  )
  const programImgs = [
    await image(payload, 'Chương trình Cử nhân', 'Bachelor program'),
    await image(payload, 'Chương trình MBA', 'MBA program'),
  ]
  const newsImgs: Media[] = []
  for (let i = 0; i < 10; i++)
    newsImgs.push(await image(payload, `Tin tức mẫu ${i + 1}`, `Sample news ${i + 1}`))
  const eventImgs: Media[] = []
  for (let i = 0; i < 4; i++)
    eventImgs.push(await image(payload, `Sự kiện mẫu ${i + 1}`, `Sample event ${i + 1}`))
  const peopleImgs: Media[] = []
  for (let i = 0; i < 3; i++)
    peopleImgs.push(await image(payload, `Giảng viên ${i + 1}`, `Lecturer ${i + 1}`))

  payload.logger.info('Cơ sở…')
  const campuses: Campus[] = []
  for (const [i, c] of CAMPUSES.entries()) {
    campuses.push(
      await createLocalized<Campus>(
        payload,
        'campuses',
        {
          name: c.vi,
          slug: slugify(c.vi),
          city: c.city,
          address: c.addressVi,
          phone: c.phone,
          email: 'swinburne@fe.edu.vn',
          mapUrl: `https://maps.google.com/?q=${encodeURIComponent(c.addressVi)}`,
          images: [campusImgs[i]!.id],
          sortOrder: i + 1,
          description: lexical([
            `Giới thiệu mẫu về cơ sở ${c.vi}. Nội dung chi tiết sẽ được cập nhật.`,
          ]),
        },
        {
          name: c.en,
          slug: slugify(c.en),
          address: c.addressEn,
          description: lexical([`Sample introduction to the ${c.en} campus. Details coming soon.`]),
        },
      ),
    )
  }

  payload.logger.info('Chuyên mục, thẻ…')
  const catDefs: [string, string][] = [
    ['Tuyển sinh', 'Admissions'],
    ['Đời sống sinh viên', 'Student life'],
    ['Thành tích', 'Achievements'],
    ['Hợp tác doanh nghiệp', 'Industry partnerships'],
  ]
  const categories: Category[] = []
  for (const [vi, en] of catDefs) {
    const cat = await payload.create({
      collection: 'categories',
      data: { title: vi, slug: slugify(vi) },
      locale: 'vi',
      overrideAccess: true,
      context,
    })
    await payload.update({
      collection: 'categories',
      id: cat.id,
      data: { title: en, slug: slugify(en) },
      locale: 'en',
      overrideAccess: true,
      context,
    })
    categories.push(cat)
  }
  const tag = await payload.create({
    collection: 'tags',
    data: { title: 'Học bổng', slug: 'hoc-bong' },
    locale: 'vi',
    overrideAccess: true,
    context,
  })
  await payload.update({
    collection: 'tags',
    id: tag.id,
    data: { title: 'Scholarships', slug: 'scholarships' },
    locale: 'en',
    overrideAccess: true,
    context,
  })

  payload.logger.info('FAQ…')
  const faqs: Faq[] = []
  for (const [i, f] of FAQS.entries()) {
    faqs.push(
      await createLocalized<Faq>(
        payload,
        'faqs',
        {
          question: f.vi[0],
          answer: lexical([f.vi[1]]),
          group: f.group,
          sortOrder: i + 1,
          slug: slugify(f.vi[0]),
        },
        { question: f.en[0], answer: lexical([f.en[1]]), slug: slugify(f.en[0]) },
      ),
    )
  }

  payload.logger.info('Môn học…')
  const subjectDefs: [string, string, string][] = [
    ['COS10009', 'Nhập môn lập trình (mẫu)', 'Introduction to Programming (sample)'],
    ['COS20007', 'Lập trình hướng đối tượng (mẫu)', 'Object Oriented Programming (sample)'],
    ['COS30049', 'Trí tuệ nhân tạo ứng dụng (mẫu)', 'Applied Artificial Intelligence (sample)'],
    ['MKT10007', 'Nguyên lý Marketing (mẫu)', 'Marketing Principles (sample)'],
    ['BUS10012', 'Nhập môn kinh doanh (mẫu)', 'Introduction to Business (sample)'],
    ['DES10003', 'Tư duy thiết kế (mẫu)', 'Design Thinking (sample)'],
  ]
  const subjects: number[] = []
  for (const [code, vi, en] of subjectDefs) {
    const s = await createLocalized<{ id: number }>(
      payload,
      'subjects',
      {
        code,
        credits: 12.5,
        title: vi,
        slug: slugify(`${code} ${vi}`),
        description: lexical(['Mô tả môn học mẫu.']),
      },
      {
        title: en,
        slug: slugify(`${code} ${en}`),
        description: lexical(['Sample subject description.']),
      },
    )
    subjects.push(s.id)
  }

  payload.logger.info('Chương trình…')
  const sampleTuitionNote = {
    vi: 'Số liệu mẫu — không phải học phí thật',
    en: 'Sample figure — not real tuition',
  }
  const bachelor = await createLocalized<Program>(
    payload,
    'programs',
    {
      title: 'Chương trình Cử nhân',
      slug: 'cu-nhan',
      level: 'bachelor',
      duration: '3 năm (mẫu)',
      summary:
        'Chương trình cử nhân chuẩn Úc với 16 ngành thuộc Kinh doanh, CNTT và Truyền thông (nội dung mẫu).',
      heroImage: programImgs[0]!.id,
      body: lexical([
        { h2: 'Tổng quan' },
        'Nội dung mẫu giới thiệu chương trình Cử nhân.',
        {
          ul: [
            'Bằng do Swinburne (Úc) cấp',
            'Giảng dạy bằng tiếng Anh',
            'Lộ trình chuyển tiếp sang Úc',
          ],
        },
      ]),
      campuses: campuses.map((c) => c.id),
      tuitionByYear: [
        {
          academicYear: '2025-2026',
          amount: 100000000,
          currency: 'VND',
          note: sampleTuitionNote.vi,
        },
        {
          academicYear: '2026-2027',
          amount: 110000000,
          currency: 'VND',
          note: sampleTuitionNote.vi,
        },
      ],
      entryRequirements: lexical([
        'Điều kiện đầu vào mẫu: tốt nghiệp THPT, đáp ứng yêu cầu tiếng Anh.',
      ]),
      transferPathway: lexical([
        'Lộ trình mẫu: học 1–2 năm tại Việt Nam, chuyển tiếp sang Melbourne.',
      ]),
      faqs: faqs.filter((_, i) => i < 7).map((f) => f.id),
      sortOrder: 1,
    },
    {
      title: 'Bachelor Program',
      slug: 'bachelor',
      duration: '3 years (sample)',
      summary:
        'Australian-standard bachelor program with 16 majors across Business, IT and Media (sample content).',
      body: lexical([
        { h2: 'Overview' },
        'Sample introduction to the Bachelor program.',
        {
          ul: [
            'Degree awarded by Swinburne (Australia)',
            'Taught in English',
            'Transfer pathway to Australia',
          ],
        },
      ]),
      tuitionByYear: [
        {
          academicYear: '2025-2026',
          amount: 100000000,
          currency: 'VND',
          note: sampleTuitionNote.en,
        },
        {
          academicYear: '2026-2027',
          amount: 110000000,
          currency: 'VND',
          note: sampleTuitionNote.en,
        },
      ],
      entryRequirements: lexical([
        'Sample entry requirements: high school graduation and English proficiency.',
      ]),
      transferPathway: lexical([
        'Sample pathway: 1–2 years in Vietnam, then transfer to Melbourne.',
      ]),
    },
  )
  const mba = await createLocalized<Program>(
    payload,
    'programs',
    {
      title: 'Thạc sĩ Quản trị Kinh doanh (MBA)',
      slug: 'mba',
      level: 'master',
      duration: '1,5–2 năm (mẫu)',
      summary: 'Chương trình MBA dành cho người đi làm (nội dung mẫu).',
      heroImage: programImgs[1]!.id,
      body: lexical(['Nội dung mẫu giới thiệu chương trình MBA.']),
      campuses: [campuses[0]!.id, campuses[3]!.id],
      tuitionByYear: [
        {
          academicYear: '2026-2027',
          amount: 300000000,
          currency: 'VND',
          note: sampleTuitionNote.vi,
        },
      ],
      faqs: [faqs[3]!.id, faqs[5]!.id],
      sortOrder: 2,
    },
    {
      title: 'Master of Business Administration (MBA)',
      slug: 'mba',
      duration: '1.5–2 years (sample)',
      summary: 'MBA program for working professionals (sample content).',
      body: lexical(['Sample introduction to the MBA program.']),
      tuitionByYear: [
        {
          academicYear: '2026-2027',
          amount: 300000000,
          currency: 'VND',
          note: sampleTuitionNote.en,
        },
      ],
    },
  )

  payload.logger.info('16 ngành…')
  for (const [i, m] of MAJORS.entries()) {
    const careersVi =
      m.group === 'it'
        ? ['Kỹ sư phần mềm', 'Chuyên viên dữ liệu']
        : m.group === 'media'
          ? ['Chuyên viên truyền thông', 'Nhà thiết kế']
          : ['Chuyên viên phân tích', 'Quản lý dự án']
    const careersEn =
      m.group === 'it'
        ? ['Software engineer', 'Data specialist']
        : m.group === 'media'
          ? ['Communications specialist', 'Designer']
          : ['Analyst', 'Project manager']
    await createLocalized(
      payload,
      'majors',
      {
        title: m.vi,
        slug: slugify(m.vi),
        program: bachelor.id,
        summary: `Ngành ${m.vi} — mô tả mẫu.`,
        body: lexical([`Nội dung mẫu về ngành ${m.vi}.`]),
        careers: careersVi.map((title) => ({ title })),
        subjects: subjects.slice(0, 3 + (i % 3)),
        sortOrder: i + 1,
      },
      {
        title: m.en,
        slug: slugify(m.en),
        summary: `${m.en} — sample description.`,
        body: lexical([`Sample content about ${m.en}.`]),
        careers: careersEn.map((title) => ({ title })),
      },
    )
  }

  payload.logger.info('30 tin tức…')
  for (const [i, [vi, en]] of NEWS_TITLES.entries()) {
    const old = i >= 22
    const publishedAt = old ? monthsAgo(19 + (i - 22) * 4) : daysFromNow(-(i * 14 + 1))
    const viOnly = i % 4 === 3
    const noImage = i % 5 === 2
    const cat = categories[i % categories.length]!
    await createLocalized(
      payload,
      'news',
      {
        title: vi,
        slug: slugify(vi, 90),
        excerpt: `Tóm tắt mẫu cho bài: ${vi}`,
        content: lexical([
          { h2: 'Nội dung chính' },
          `Đoạn văn mẫu thứ nhất của bài "${vi}".`,
          'Đoạn văn mẫu thứ hai.',
          { ul: ['Ý thứ nhất', 'Ý thứ hai'] },
        ]),
        featuredImage: noImage ? null : newsImgs[i % newsImgs.length]!.id,
        categories: [cat.id],
        tags: i % 6 === 0 ? [tag.id] : [],
        campus: campuses[i % campuses.length]!.id,
        publishedAt,
      },
      viOnly
        ? null
        : {
            title: en,
            slug: slugify(en, 90),
            excerpt: `Sample summary for: ${en}`,
            content: lexical([
              { h2: 'Main content' },
              `First sample paragraph of "${en}".`,
              'Second sample paragraph.',
            ]),
          },
    )
  }

  payload.logger.info('8 sự kiện…')
  const eventDefs: { vi: string; en: string | null; start: number; open: boolean }[] = [
    {
      vi: 'Ngày hội tư vấn tuyển sinh (mẫu)',
      en: 'Admissions open day (sample)',
      start: 10,
      open: true,
    },
    {
      vi: 'Workshop: Định hướng ngành CNTT (mẫu)',
      en: 'Workshop: Choosing an IT major (sample)',
      start: 20,
      open: true,
    },
    {
      vi: 'Hội thảo du học chuyển tiếp Úc (mẫu)',
      en: 'Australia transfer pathway seminar (sample)',
      start: 35,
      open: false,
    },
    { vi: 'Tham quan cơ sở Hòa Lạc (mẫu — chỉ tiếng Việt)', en: null, start: 60, open: true },
    {
      vi: 'Lễ trao học bổng (mẫu)',
      en: 'Scholarship award ceremony (sample)',
      start: -10,
      open: false,
    },
    { vi: 'Ngày hội việc làm (mẫu)', en: 'Career fair (sample)', start: -40, open: false },
    {
      vi: 'Đêm nhạc sinh viên (mẫu)',
      en: 'Student music night (sample)',
      start: -200,
      open: false,
    },
    {
      vi: 'Hội thảo khoa học sinh viên (mẫu)',
      en: 'Student research conference (sample)',
      start: -700,
      open: false,
    },
  ]
  for (const [i, e] of eventDefs.entries()) {
    const startAt = daysFromNow(e.start)
    await createLocalized(
      payload,
      'events',
      {
        title: e.vi,
        slug: slugify(e.vi),
        startAt,
        endAt: new Date(new Date(startAt).getTime() + 3 * 3600 * 1000).toISOString(),
        location: `Hội trường cơ sở ${CAMPUSES[i % 5]!.vi}`,
        campus: campuses[i % 5]!.id,
        featuredImage: i % 3 === 2 ? null : eventImgs[i % eventImgs.length]!.id,
        content: lexical([
          'Nội dung mẫu về sự kiện.',
          { ul: ['Giao lưu với giảng viên', 'Tư vấn trực tiếp'] },
        ]),
        registrationOpen: e.open,
      },
      e.en
        ? {
            title: e.en,
            slug: slugify(e.en),
            location: `${CAMPUSES[i % 5]!.en} campus hall`,
            content: lexical(['Sample event content.']),
          }
        : null,
    )
  }

  payload.logger.info('Giảng viên, cảm nhận, nghiên cứu…')
  for (let i = 0; i < 6; i++) {
    await createLocalized(
      payload,
      'people',
      {
        name: `TS. Giảng viên mẫu ${i + 1}`,
        slug: `giang-vien-mau-${i + 1}`,
        title: i % 2 ? 'Giảng viên CNTT' : 'Giảng viên Kinh doanh',
        photo: i < 3 ? peopleImgs[i]!.id : null,
        bio: lexical(['Tiểu sử mẫu.']),
        expertise: i % 2 ? 'Trí tuệ nhân tạo, dữ liệu' : 'Marketing, quản trị',
        sortOrder: i + 1,
      },
      {
        title: i % 2 ? 'IT Lecturer' : 'Business Lecturer',
        bio: lexical(['Sample biography.']),
        expertise: i % 2 ? 'AI, data' : 'Marketing, management',
      },
    )
  }
  for (let i = 0; i < 5; i++) {
    await createLocalized(
      payload,
      'testimonials',
      {
        name: `Sinh viên mẫu ${i + 1}`,
        slug: `sinh-vien-mau-${i + 1}`,
        role: `Sinh viên năm ${(i % 3) + 1} (mẫu)`,
        program: i % 2 ? mba.id : bachelor.id,
        quote:
          'Cảm nhận mẫu: môi trường học tập năng động, giảng viên tận tâm và nhiều cơ hội thực tế.',
      },
      {
        role: `Year ${(i % 3) + 1} student (sample)`,
        quote:
          'Sample testimonial: a dynamic learning environment, dedicated lecturers and plenty of real-world opportunities.',
      },
    )
  }
  const researchTypes = ['paper', 'conference', 'lab', 'project', 'paper'] as const
  for (let i = 0; i < 5; i++) {
    await createLocalized(
      payload,
      'research',
      {
        title: `Công trình nghiên cứu mẫu số ${i + 1}`,
        slug: `cong-trinh-nghien-cuu-mau-${i + 1}`,
        type: researchTypes[i],
        authors: 'Nhóm tác giả mẫu',
        content: lexical(['Tóm tắt nghiên cứu mẫu.']),
        publishedAt: daysFromNow(-(i * 60 + 5)),
      },
      {
        title: `Sample research output ${i + 1}`,
        slug: `sample-research-output-${i + 1}`,
        content: lexical(['Sample research abstract.']),
      },
    )
  }

  payload.logger.info('Trang (blocks)…')
  const homeVi = [
    {
      blockType: 'hero',
      heading: 'Học chuẩn Úc ngay tại Việt Nam',
      subheading:
        'Swinburne Việt Nam — chương trình liên kết giữa Swinburne University of Technology (Úc) và Tổ chức Giáo dục FPT. (Nội dung mẫu)',
      image: heroImg.id,
      primaryCta: { label: 'Đăng ký tư vấn', url: '/dang-ky-tu-van' },
      secondaryCta: { label: 'Xem chương trình', url: '/chuong-trinh' },
      isPageTitle: true,
    },
    {
      blockType: 'stats',
      heading: 'Swinburne Việt Nam qua các con số (mẫu)',
      items: [
        { value: '5', label: 'Cơ sở trên toàn quốc' },
        { value: '16', label: 'Ngành học' },
        { value: '100%', label: 'Giảng dạy bằng tiếng Anh' },
        { value: 'Top', label: 'Số liệu mẫu' },
      ],
    },
    {
      blockType: 'cardGrid',
      heading: 'Chương trình nổi bật',
      source: 'programs',
      limit: 3,
      columns: '2',
      moreLink: { label: 'Tất cả chương trình', url: '/chuong-trinh' },
    },
    {
      blockType: 'cardGrid',
      heading: 'Vì sao chọn Swinburne?',
      source: 'manual',
      columns: '4',
      items: [
        { title: 'Bằng Úc', text: 'Bằng do Swinburne University of Technology cấp (mẫu).' },
        { title: 'Học qua dự án', text: 'Học tập gắn với doanh nghiệp (mẫu).' },
        { title: 'Chuyển tiếp quốc tế', text: 'Lộ trình sang Melbourne (mẫu).' },
        { title: '5 cơ sở', text: 'Hà Nội, Hòa Lạc, Đà Nẵng, TP.HCM, Cần Thơ.' },
      ],
    },
    {
      blockType: 'cardGrid',
      heading: 'Tin mới',
      source: 'news',
      limit: 3,
      columns: '3',
      moreLink: { label: 'Tất cả tin tức', url: '/tin-tuc' },
    },
    {
      blockType: 'cardGrid',
      heading: 'Sự kiện sắp diễn ra',
      source: 'events',
      limit: 3,
      columns: '3',
      moreLink: { label: 'Tất cả sự kiện', url: '/su-kien' },
    },
    { blockType: 'testimonials', heading: 'Sinh viên nói gì về Swinburne' },
    { blockType: 'faqList', heading: 'Câu hỏi thường gặp', group: 'admissions' },
    {
      blockType: 'cta',
      heading: 'Sẵn sàng bắt đầu?',
      text: 'Để lại thông tin để được tư vấn miễn phí.',
      primary: { label: 'Đăng ký tư vấn', url: '/dang-ky-tu-van' },
      tone: 'brand',
    },
  ]
  const homeEn = [
    {
      blockType: 'hero',
      heading: 'An Australian education in Vietnam',
      subheading:
        'Swinburne Vietnam — an alliance between Swinburne University of Technology (Australia) and FPT Education. (Sample content)',
      image: heroImg.id,
      primaryCta: { label: 'Get advice', url: '/en/register' },
      secondaryCta: { label: 'Explore programs', url: '/en/programs' },
      isPageTitle: true,
    },
    {
      blockType: 'stats',
      heading: 'Swinburne Vietnam in numbers (sample)',
      items: [
        { value: '5', label: 'Campuses nationwide' },
        { value: '16', label: 'Majors' },
        { value: '100%', label: 'Taught in English' },
        { value: 'Top', label: 'Sample figure' },
      ],
    },
    {
      blockType: 'cardGrid',
      heading: 'Featured programs',
      source: 'programs',
      limit: 3,
      columns: '2',
      moreLink: { label: 'All programs', url: '/en/programs' },
    },
    {
      blockType: 'cardGrid',
      heading: 'Latest news',
      source: 'news',
      limit: 3,
      columns: '3',
      moreLink: { label: 'All news', url: '/en/news' },
    },
    {
      blockType: 'cardGrid',
      heading: 'Upcoming events',
      source: 'events',
      limit: 3,
      columns: '3',
      moreLink: { label: 'All events', url: '/en/events' },
    },
    { blockType: 'testimonials', heading: 'What our students say' },
    {
      blockType: 'cta',
      heading: 'Ready to start?',
      text: 'Leave your details for free advice.',
      primary: { label: 'Get advice', url: '/en/register' },
      tone: 'brand',
    },
  ]
  await createLocalized(
    payload,
    'pages',
    { title: 'Trang chủ', slug: 'home', layout: homeVi },
    { title: 'Home', slug: 'home', layout: homeEn },
  )

  await createLocalized(
    payload,
    'pages',
    {
      title: 'Về chúng tôi',
      slug: 've-chung-toi',
      layout: [
        {
          blockType: 'hero',
          heading: 'Về Swinburne Việt Nam',
          subheading: 'Chương trình liên kết quốc tế (nội dung mẫu).',
          isPageTitle: true,
        },
        {
          blockType: 'richText',
          content: lexical([
            { h2: 'Sứ mệnh' },
            'Nội dung mẫu về sứ mệnh.',
            { h2: 'Lịch sử' },
            'Nội dung mẫu về lịch sử hình thành.',
          ]),
        },
        {
          blockType: 'table',
          caption: 'Các mốc phát triển (mẫu)',
          columns: [{ label: 'Năm' }, { label: 'Sự kiện' }],
          rows: [
            { cells: [{ value: 'Năm A' }, { value: 'Mốc mẫu thứ nhất' }] },
            { cells: [{ value: 'Năm B' }, { value: 'Mốc mẫu thứ hai' }] },
          ],
        },
        {
          blockType: 'cardGrid',
          heading: 'Hệ thống cơ sở',
          source: 'campuses',
          limit: 5,
          columns: '3',
        },
        {
          blockType: 'cta',
          heading: 'Liên hệ tư vấn',
          primary: { label: 'Đăng ký tư vấn', url: '/dang-ky-tu-van' },
          tone: 'dark',
        },
      ],
    },
    {
      title: 'About us',
      slug: 'about-us',
      layout: [
        {
          blockType: 'hero',
          heading: 'About Swinburne Vietnam',
          subheading: 'An international alliance program (sample content).',
          isPageTitle: true,
        },
        {
          blockType: 'richText',
          content: lexical([{ h2: 'Mission' }, 'Sample mission statement.']),
        },
        {
          blockType: 'cardGrid',
          heading: 'Our campuses',
          source: 'campuses',
          limit: 5,
          columns: '3',
        },
      ],
    },
  )

  await createLocalized(
    payload,
    'pages',
    {
      title: 'Đăng ký tư vấn',
      slug: 'dang-ky-tu-van',
      layout: [
        {
          blockType: 'leadForm',
          heading: 'Đăng ký nhận tư vấn',
          intro: 'Đội ngũ tuyển sinh sẽ liên hệ trong 24 giờ làm việc.',
          anchor: 'dang-ky',
        },
        { blockType: 'faqList', heading: 'Câu hỏi thường gặp', group: 'admissions' },
      ],
    },
    {
      title: 'Request advice',
      slug: 'register',
      layout: [
        {
          blockType: 'leadForm',
          heading: 'Request advice',
          intro: 'Our admissions team will contact you within one business day.',
          anchor: 'dang-ky',
        },
      ],
    },
  )

  payload.logger.info('Menu, chân trang, cài đặt…')
  const campusChildrenVi = campuses.map((c, i) => ({
    label: CAMPUSES[i]!.vi,
    url: `/co-so/${c.slug}`,
  }))
  const campusChildrenEn = CAMPUSES.map((c) => ({
    label: c.en,
    url: `/en/campuses/${slugify(c.en)}`,
  }))
  await payload.updateGlobal({
    slug: 'header',
    locale: 'vi',
    overrideAccess: true,
    context,
    data: {
      navItems: [
        {
          label: 'Chương trình',
          url: '/chuong-trinh',
          children: [
            { label: 'Cử nhân', url: '/chuong-trinh/cu-nhan' },
            { label: 'Thạc sĩ MBA', url: '/chuong-trinh/mba' },
            { label: 'Tất cả ngành học', url: '/nganh' },
          ],
        },
        {
          label: 'Tuyển sinh',
          url: '/dang-ky-tu-van',
          children: [
            { label: 'Đăng ký tư vấn', url: '/dang-ky-tu-van' },
            { label: 'Cổng tuyển sinh', url: 'https://tuyensinh.swin.edu.vn', external: true },
            {
              label: 'Tài liệu tải về',
              url: 'https://download.swinburne-vn.edu.vn',
              external: true,
            },
          ],
        },
        { label: 'Cơ sở', url: '/co-so', children: campusChildrenVi },
        {
          label: 'Sinh viên',
          url: null,
          children: [
            { label: 'Canvas', url: 'https://swinburne.instructure.com/', external: true },
            { label: 'Showcase', url: 'https://showcase.swinburne-vn.edu.vn', external: true },
          ],
        },
        { label: 'Nghiên cứu & Doanh nghiệp', url: '/nghien-cuu' },
        {
          label: 'Tin tức & Sự kiện',
          url: '/tin-tuc',
          children: [
            { label: 'Tin tức', url: '/tin-tuc' },
            { label: 'Sự kiện', url: '/su-kien' },
            { label: 'Lưu trữ', url: '/tin-tuc/luu-tru' },
          ],
        },
        { label: 'Về chúng tôi', url: '/ve-chung-toi' },
      ],
      cta: { label: 'Đăng ký tư vấn', url: '/dang-ky-tu-van' },
      utilityLinks: [
        { label: 'Canvas', url: 'https://swinburne.instructure.com/' },
        { label: 'Tuyển sinh', url: 'https://tuyensinh.swin.edu.vn' },
      ],
    },
  })
  await payload.updateGlobal({
    slug: 'header',
    locale: 'en',
    overrideAccess: true,
    context,
    data: {
      navItems: [
        {
          label: 'Programs',
          url: '/en/programs',
          children: [
            { label: 'Bachelor', url: '/en/programs/bachelor' },
            { label: 'MBA', url: '/en/programs/mba' },
            { label: 'All majors', url: '/en/majors' },
          ],
        },
        {
          label: 'Admissions',
          url: '/en/register',
          children: [
            { label: 'Request advice', url: '/en/register' },
            { label: 'Admissions portal', url: 'https://tuyensinh.swin.edu.vn', external: true },
          ],
        },
        { label: 'Campuses', url: '/en/campuses', children: campusChildrenEn },
        {
          label: 'Students',
          url: null,
          children: [
            { label: 'Canvas', url: 'https://swinburne.instructure.com/', external: true },
            { label: 'Showcase', url: 'https://showcase.swinburne-vn.edu.vn', external: true },
          ],
        },
        { label: 'Research & Industry', url: '/en/research' },
        {
          label: 'News & Events',
          url: '/en/news',
          children: [
            { label: 'News', url: '/en/news' },
            { label: 'Events', url: '/en/events' },
            { label: 'Archive', url: '/en/news/archive' },
          ],
        },
        { label: 'About us', url: '/en/about-us' },
      ],
      cta: { label: 'Get advice', url: '/en/register' },
      utilityLinks: [{ label: 'Canvas', url: 'https://swinburne.instructure.com/' }],
    },
  })
  const quickLinks = [
    { label: 'Canvas', url: 'https://swinburne.instructure.com/' },
    { label: 'Tuyển sinh / Admissions', url: 'https://tuyensinh.swin.edu.vn' },
    { label: 'Download', url: 'https://download.swinburne-vn.edu.vn' },
    { label: 'Showcase', url: 'https://showcase.swinburne-vn.edu.vn' },
  ]
  await payload.updateGlobal({
    slug: 'footer',
    locale: 'vi',
    overrideAccess: true,
    context,
    data: {
      about:
        'Swinburne Việt Nam là chương trình liên kết giữa Swinburne University of Technology (Úc) và Tổ chức Giáo dục FPT. (Mẫu)',
      quickLinks,
      copyright: '© Swinburne Việt Nam. Nội dung mẫu cho giai đoạn phát triển.',
    },
  })
  await payload.updateGlobal({
    slug: 'footer',
    locale: 'en',
    overrideAccess: true,
    context,
    data: {
      about:
        'Swinburne Vietnam is an alliance between Swinburne University of Technology (Australia) and FPT Education. (Sample)',
      quickLinks,
      copyright: '© Swinburne Vietnam. Sample content for development.',
    },
  })
  await payload.updateGlobal({
    slug: 'siteSettings',
    locale: 'vi',
    overrideAccess: true,
    context,
    data: {
      siteName: 'Swinburne Việt Nam',
      tagline: 'Học chuẩn Úc tại Việt Nam',
      organizationDescription:
        'Chương trình liên kết giữa Swinburne University of Technology (Úc) và Tổ chức Giáo dục FPT.',
      generalEmail: 'swinburne@fe.edu.vn',
      defaultOgImage: heroImg.id,
    },
  })
  await payload.updateGlobal({
    slug: 'siteSettings',
    locale: 'en',
    overrideAccess: true,
    context,
    data: {
      siteName: 'Swinburne Vietnam',
      tagline: 'Australian education in Vietnam',
      organizationDescription:
        'An alliance between Swinburne University of Technology (Australia) and FPT Education.',
    },
  })

  payload.logger.info('Redirect mẫu…')
  const firstNews = await payload.find({
    collection: 'news',
    limit: 1,
    sort: '-publishedAt',
    overrideAccess: true,
    depth: 0,
  })
  await payload.create({
    collection: 'redirects',
    overrideAccess: true,
    context,
    data: {
      from: '/2021/05/bai-viet-cu/',
      to: { type: 'reference', reference: { relationTo: 'news', value: firstNews.docs[0]!.id } },
      type: '301',
    },
  })
  await payload.create({
    collection: 'redirects',
    overrideAccess: true,
    context,
    data: { from: '/gioi-thieu/', to: { type: 'custom', url: '/ve-chung-toi' }, type: '301' },
  })

  payload.logger.info(`Xong sau ${((Date.now() - started) / 1000).toFixed(1)}s`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
