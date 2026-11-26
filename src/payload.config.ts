import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { vi } from '@payloadcms/translations/languages/vi'
import { buildConfig, type Field } from 'payload'
import sharp from 'sharp'

import { isAdmin, isEditor } from './access'
import { Campuses } from './collections/campuses'
import { Documents } from './collections/documents'
import { Events } from './collections/events'
import { Faqs } from './collections/faqs'
import { Leads } from './collections/leads'
import { Majors } from './collections/majors'
import { Media } from './collections/media'
import { News } from './collections/news'
import { Pages } from './collections/pages'
import { People } from './collections/people'
import { Programs } from './collections/programs'
import { Research } from './collections/research'
import { Subjects } from './collections/subjects'
import { Categories, Tags } from './collections/taxonomies'
import { Testimonials } from './collections/testimonials'
import { Users } from './collections/users'
import { Footer } from './globals/footer'
import { Header } from './globals/header'
import { SiteSettings } from './globals/site-settings'
import { safeRevalidate } from './hooks/revalidate'
import { crmSweepTask, crmSyncTask } from './jobs/crm-sync'
import { cacheTags } from './lib/cache-tags'
import { defaultLocale, toLocale } from './lib/i18n/config'
import { docHref } from './lib/i18n/routes'
import { bumpRedirectsVersion } from './lib/redirects'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

const seoCollections = [
  'pages',
  'programs',
  'majors',
  'campuses',
  'news',
  'events',
  'research',
] as const

function shouldRunProdMigrations(): boolean {
  const instance = process.env.NODE_APP_INSTANCE
  return instance === undefined || instance === '0'
}

function shouldAutoRunJobs(): boolean {
  if (process.env.JOBS_AUTORUN === 'false') return false
  // PM2 cluster: chỉ instance 0 chạy jobs để tránh xử lý trùng
  const instance = process.env.NODE_APP_INSTANCE
  return instance === undefined || instance === '0'
}

export default buildConfig({
  serverURL: siteUrl,
  secret: process.env.PAYLOAD_SECRET || '',
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' — Swinburne VN CMS' },
    dateFormat: 'dd/MM/yyyy HH:mm',
  },
  i18n: {
    supportedLanguages: { vi, en },
    fallbackLanguage: 'vi',
  },
  localization: {
    locales: [
      { code: 'vi', label: 'Tiếng Việt' },
      { code: 'en', label: 'English' },
    ],
    defaultLocale,
    // Không fallback: bài chưa dịch thì bản en để trống (biết thiếu bản dịch, không hiện hreflang)
    fallback: false,
  },
  collections: [
    Pages,
    News,
    Events,
    Categories,
    Tags,
    Programs,
    Majors,
    Subjects,
    Campuses,
    Research,
    People,
    Testimonials,
    Faqs,
    Documents,
    Media,
    Leads,
    Users,
  ],
  globals: [Header, Footer, SiteSettings],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '', max: 10 },
    // Luôn dùng migration (CLAUDE.md mục 11) — không push schema tự động
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
    // Production (bản standalone không có Payload CLI): chạy migration khi khởi động.
    // PM2 cluster: chỉ instance 0 chạy; pm2 reload khởi động lại instance 0 trước.
    prodMigrations: shouldRunProdMigrations() ? migrations : undefined,
  }),
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  graphQL: { disablePlaygroundInProduction: true },
  upload: { limits: { fileSize: 20 * 1024 * 1024 } },
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.SMTP_FROM || 'no-reply@swinburne-vn.edu.vn',
        defaultFromName: 'Swinburne Vietnam Website',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
        },
      })
    : undefined,
  jobs: {
    tasks: [crmSyncTask, crmSweepTask],
    autoRun: [{ cron: '* * * * *', queue: 'crm', limit: 20 }],
    shouldAutoRun: shouldAutoRunJobs,
    deleteJobOnComplete: true,
    access: { run: ({ req }) => Boolean(req.user) },
    jobsCollectionOverrides: ({ defaultJobsCollection }) => ({
      ...defaultJobsCollection,
      admin: { ...defaultJobsCollection.admin, group: 'Hệ thống', hidden: false },
      access: { ...defaultJobsCollection.access, read: isAdmin },
    }),
  },
  plugins: [
    seoPlugin({
      collections: [...seoCollections],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }) => {
        const d = doc as { title?: string; name?: string }
        return `${d.title ?? d.name ?? ''} | Swinburne Việt Nam`
      },
      generateDescription: ({ doc }) => {
        const d = doc as { summary?: string; excerpt?: string }
        return (d.summary ?? d.excerpt ?? '').slice(0, 160)
      },
      generateURL: ({ doc, collectionConfig, locale }) => {
        const slug = (doc as { slug?: string }).slug
        if (!slug || !collectionConfig) return siteUrl
        return `${siteUrl}${docHref(toLocale(locale), collectionConfig.slug, slug)}`
      },
      fields: ({ defaultFields }) => [
        ...defaultFields,
        {
          name: 'focusKeyword',
          type: 'text',
          label: 'Từ khoá chính',
          localized: true,
          admin: { description: 'Từ khoá SEO chính (tham khảo, không hiển thị).' },
        },
        { name: 'noindex', type: 'checkbox', label: 'Ẩn khỏi Google (noindex)' },
      ],
    }),
    redirectsPlugin({
      collections: ['pages', 'news', 'events', 'programs', 'majors', 'campuses', 'research'],
      redirectTypes: ['301', '302'],
      overrides: {
        labels: { singular: 'Chuyển hướng', plural: 'Chuyển hướng (redirect)' },
        admin: { group: 'Hệ thống', defaultColumns: ['from', 'to', 'type'] },
        access: { read: () => true, create: isEditor, update: isEditor, delete: isEditor },
        fields: ({ defaultFields }) =>
          defaultFields.map((field): Field => {
            if (field.type === 'text' && field.name === 'from') {
              return {
                ...field,
                index: true,
                admin: { description: 'Đường dẫn cũ, bắt đầu bằng "/", vd /2021/05/bai-viet-cu/' },
              }
            }
            return field
          }),
        hooks: {
          afterChange: [
            ({ doc, req }) => {
              bumpRedirectsVersion()
              safeRevalidate([cacheTags.redirects], req)
              return doc
            },
          ],
          afterDelete: [
            ({ doc, req }) => {
              bumpRedirectsVersion()
              safeRevalidate([cacheTags.redirects], req)
              return doc
            },
          ],
        },
      },
    }),
  ],
})
