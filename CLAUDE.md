# CLAUDE.md — Swinburne Vietnam website (swinburne-vn.edu.vn)

Tài liệu này là bối cảnh cố định cho Claude khi code dự án. Đọc hết trước khi làm bất kỳ việc gì.
Các mục "ĐÃ CHỐT" không được tự ý thay đổi; nếu thấy cần đổi, dừng lại và hỏi.

---

## 1. Dự án là gì

Xây lại trang chính **swinburne-vn.edu.vn** (Swinburne Vietnam Alliance Program — liên kết giữa
Swinburne University of Technology, Úc và FPT Education), thay cho WordPress hiện tại.

- **Mục tiêu số 1:** tăng lượt đăng ký tư vấn / nhập học. Mọi trang phải dẫn tới form đăng ký.
- **Phạm vi:** CHỈ trang chính. Các subdomain `tuyensinh.swin.edu.vn`, `download.swinburne-vn.edu.vn`,
  `showcase.swinburne-vn.edu.vn` giữ nguyên, trang mới chỉ link sang.
- **Dữ liệu:** chuyển TOÀN BỘ nội dung từ WordPress cũ (2019 → nay), không bỏ bài nào.
- **Ngôn ngữ:** tiếng Việt (mặc định, URL gốc `/`) và tiếng Anh (`/en/...`).
- **Người dùng CMS:** biên tập viên không biết code.

## 2. Stack — ĐÃ CHỐT

| Lớp | Công nghệ | Ghi chú |
|---|---|---|
| Framework | Next.js (App Router) + React + TypeScript strict | `output: 'standalone'` |
| CMS | Payload CMS, chạy chung trong app Next.js | Dùng bản ổn định mới nhất; kiểm tra docs đúng phiên bản trước khi viết config |
| Database | **PostgreSQL 16** qua `@payloadcms/db-postgres` | KHÔNG dùng MySQL/MongoDB cho Payload |
| Rich text | Lexical (`@payloadcms/richtext-lexical`) | |
| Styling | Tailwind CSS | Token màu/font theo nhận diện Swinburne, khai báo tập trung |
| i18n | Localization của Payload (`vi`, `en`, default `vi`) + routing Next.js | `vi` không có tiền tố, `en` có `/en` |
| Ảnh | Payload upload + sharp, lưu trên đĩa | Tự chuyển WebP (mục 6) |
| Form | React Hook Form + Zod, Cloudflare Turnstile | Lead đẩy sang CRM Laravel (mục 7) |
| SEO | `@payloadcms/plugin-seo`, `@payloadcms/plugin-redirects`, JSON-LD tự sinh | |
| Package manager | pnpm | |
| Test | Vitest (unit), Playwright (e2e), Lighthouse CI | |

## 3. Hạ tầng — ĐÃ CHỐT

- Máy chủ FCI: **Ubuntu 24.04, 4 core, 8 GB RAM. KHÔNG dùng Docker.**
- Node.js 22 LTS (NodeSource), chạy bằng **PM2** (cluster 2 instance), `pm2 reload` khi deploy.
- **Nginx** reverse proxy + Certbot TLS; Nginx phục vụ trực tiếp thư mục media.
- PostgreSQL 16 cài bằng `apt`, chỉ nghe `localhost`.
- Media lưu tại `MEDIA_DIR` (production: `/var/www/swin/media`).
- **Không build trên máy chủ.** GitHub Actions build bản standalone → rsync qua SSH → `pm2 reload`.
- Staging: cùng máy, subdomain riêng, DB riêng, `noindex`.
- Không viết Dockerfile, docker-compose hay hướng dẫn Docker.

## 3b. Môi trường phát triển — ĐÃ CHỐT

Lập trình trên **Windows + Laragon**. Production vẫn là Ubuntu (mục 3), nên code phải chạy được trên cả hai.

- **Thư mục dự án (repo gốc): `C:\laragon\www\swinburne.edu.vn`**. `CLAUDE.md` nằm ngay trong thư mục này.
  Khởi tạo dự án vào đúng thư mục này (không tạo thư mục con lồng thêm).
- Laragon có thể tự tạo virtual host `swinburne.edu.vn.test` cho thư mục này. App Next.js vẫn chạy ở
  `http://localhost:3000`. Muốn dùng domain `.test` thì cấu hình proxy về cổng 3000 (tùy chọn).

- **Node.js 22 LTS** (bản Node có sẵn trong Laragon hoặc cài riêng), bật `corepack enable` để có pnpm.
- **PostgreSQL 16 cho Payload:** thêm vào Laragon (Menu › Tools › Quick add, nếu bản Laragon có PostgreSQL)
  hoặc cài bản PostgreSQL cho Windows. Tạo DB `swin`, user `swin`.
- **MySQL của Laragon** chỉ dùng để khôi phục bản dump WordPress phục vụ giai đoạn migrate. Không dùng cho Payload.
- Terminal: PowerShell hoặc Cmder (terminal của Laragon). Claude Code chạy trên Windows cần Git for Windows.
- Chạy app bằng `pnpm dev` (cổng 3000). Không cần Apache/Nginx của Laragon. Nếu muốn domain đẹp `swin.test`
  thì cấu hình Laragon proxy về `localhost:3000` (tùy chọn).

Quy tắc để code chạy được trên cả Windows và Ubuntu:
- Script trong `package.json` không dùng cú pháp bash (`&&` thì được, còn `export`, `rm -rf`, biến môi trường kiểu
  `FOO=bar cmd` thì không). Dùng `cross-env`, `rimraf` hoặc viết script bằng Node/TS (`tsx scripts/...`).
- Đường dẫn file luôn dùng `path.join` / `path.resolve`, không ghép chuỗi với `/` hay `\`.
- `MEDIA_DIR` local là `./media` (tương đối), production là `/var/www/swin/media`.
- Thêm `.gitattributes` với `* text=auto eol=lf` và `*.sh text eol=lf`, để script deploy không bị lỗi CRLF khi chạy trên Ubuntu.
- File trong `deploy/*.sh` chỉ chạy trên máy chủ hoặc trong GitHub Actions, không chạy trên Windows.
- sharp cài bằng pnpm trên Windows bình thường. Nếu lỗi binary, chạy `pnpm rebuild sharp`.
- Khi cần lệnh hệ thống, đưa cả lệnh PowerShell (local) lẫn lệnh bash (máy chủ).

## 4. Cấu trúc thư mục mong muốn

```
/
├─ CLAUDE.md, PROMPTS.md
├─ src/
│  ├─ app/
│  │  ├─ (frontend)/[[...locale]]/...   # trang công khai (hoặc cấu trúc tương đương cho vi không tiền tố)
│  │  ├─ (payload)/admin/...            # admin Payload (do create-payload-app sinh)
│  │  ├─ api/leads/route.ts             # nhận form, lưu Lead, đẩy CRM
│  │  ├─ sitemap.ts, robots.ts
│  ├─ collections/                      # mỗi collection một file
│  ├─ globals/                          # Header, Footer, SiteSettings
│  ├─ blocks/                           # block cho Page builder
│  ├─ components/                       # UI dùng chung (server component mặc định)
│  ├─ lib/                              # seo/jsonld, i18n, crm client, utils
│  ├─ middleware.ts                     # locale + redirects
│  └─ payload.config.ts
├─ scripts/seed/                        # dữ liệu mẫu cho phát triển và test
├─ scripts/migrate/                     # ETL từ WordPress (mục 8) — chỉ tạo ở giai đoạn migrate
├─ deploy/                              # ecosystem.config.cjs (PM2), nginx.conf mẫu, backup.sh
├─ .github/workflows/                   # ci.yml, deploy.yml
└─ .env.example
```

## 5. Mô hình nội dung

Mọi collection có: `slug` (unique theo locale), `legacyId` (number, index, ẩn trong admin),
`legacyUrl` (text, index), versions + drafts bật cho nội dung biên tập. Trường đánh dấu (L) là `localized: true`.

| Collection | Trường chính |
|---|---|
| `programs` | title(L), level (`bachelor`/`master`), summary(L), body(L), duration, campuses (rel → campuses, many), tuitionByYear (array: academicYear, amount, currency, note(L)), entryRequirements(L), transferPathway(L), majors (join), heroImage, faqs (rel), seo |
| `majors` | title(L), program (rel), summary(L), body(L), careers(L, array), subjects (rel many), heroImage, seo |
| `subjects` | code, title(L), credits, description(L) |
| `campuses` | name(L), city, address(L), phone, email, mapUrl, facebookUrl, images |
| `news` | title(L), excerpt(L), content(L), featuredImage, categories (rel), tags (rel), campus (rel, optional), publishedAt, isArchived (bool, computed: > 18 tháng), seo |
| `events` | title(L), startAt, endAt, location(L), campus, content(L), registrationOpen (bool), featuredImage, seo |
| `research` | title(L), type (`paper`/`conference`/`lab`/`project`), authors, link, content(L), publishedAt |
| `people` | name, title(L), photo, bio(L), expertise(L) |
| `testimonials` | name, role(L), program (rel), quote(L), photo |
| `faqs` | question(L), answer(L), group, programs (rel many) |
| `documents` | title(L), file (upload), group |
| `pages` | title(L), layout (blocks: Hero, RichText, CardGrid, CTA, FAQList, LeadForm, Video, Table, Stats, Testimonials), seo |
| `leads` | fullName, phone, email, programInterest, campus, locale, sourceUrl, utm (group: source, medium, campaign, term, content), gclid, fbclid, idempotencyKey (unique), crmStatus (`pending`/`sent`/`failed`), crmAttempts, crmResponse, createdAt. Chỉ admin/tuyển sinh đọc được |
| `categories`, `tags` | title(L), slug |
| `media` | xem mục 6 |

Globals: `header` (menu 7 mục, CTA), `footer` (cơ sở, link nhanh, mạng xã hội), `siteSettings` (tên, logo,
GTM ID, Turnstile site key, ảnh OG mặc định).

Menu chính (7 mục): Chương trình · Tuyển sinh · Cơ sở · Sinh viên · Nghiên cứu & Doanh nghiệp · Tin tức & Sự kiện · Về chúng tôi.
Link ngoài: Canvas (`https://swinburne.instructure.com/`), tuyensinh, download, showcase.

URL: `/chuong-trinh/[slug]`, `/nganh/[slug]`, `/co-so/[slug]`, `/tin-tuc/[slug]`, `/su-kien/[slug]`,
`/nghien-cuu/[slug]`, `/[...slug]` cho pages. Bản tiếng Anh: `/en/programs/[slug]`, `/en/news/[slug]`, ...

Dữ liệu cơ sở (seed):

| Cơ sở | Địa chỉ | Điện thoại |
|---|---|---|
| Hà Nội | Số 80 Duy Tân, Phường Cầu Giấy, TP. Hà Nội | 0939 403 555 |
| Hà Nội – Hòa Lạc | Global Education Space, Tòa nhà Zeta, Đại học FPT, Khu CNC Hòa Lạc, Km29 Đại lộ Thăng Long | 0939 403 555 |
| Đà Nẵng | Lô 1+2-A14-16 Khu Công Viên Bắc đài tưởng niệm, đường 2 tháng 9, Phường Hòa Cường | 0798 210 555 |
| TP.HCM | A35 Bạch Đằng, Phường Tân Sơn Hòa | 0387 148 555 |
| Cần Thơ | Số 600 Nguyễn Văn Cừ, Phường An Bình | 0348 766 555 |

Email chung: swinburne@fe.edu.vn

## 6. Media — ĐÃ CHỐT

Collection `media` (upload):
- `staticDir`: `process.env.MEDIA_DIR`
- `mimeTypes`: `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`, `application/pdf`
- `resizeOptions`: `{ width: 2560, withoutEnlargement: true }`
- `formatOptions`: `{ format: 'webp', options: { quality: 80 } }`
- `withMetadata: false`, `focalPoint: true`
- `imageSizes` — **mỗi size đều khai `formatOptions` webp** (tránh lỗi thứ tự size):
  `thumb` 400×300 (q75), `card` 800×600 (q78), `content` 1200×auto (q80), `hero` 1920×800 (q80)
- Fields: `alt` (text, required, localized), `caption` (localized)
- Frontend dùng thẳng các size đã sinh qua `srcset`/`sizes`; KHÔNG để Next.js tối ưu ảnh lại lúc chạy
  (custom loader hoặc `unoptimized` cho ảnh từ Payload) để tiết kiệm CPU.
- Nếu phiên bản Payload đang dùng chuyển cấu hình resize sang "transformer", làm theo docs phiên bản đó, giữ nguyên các thông số trên.

## 7. Form & CRM Laravel — ĐÃ CHỐT

Luồng: Form (client) → `POST /api/leads` (Next route handler) → validate Zod + verify Turnstile →
**tạo bản ghi `leads` trước** (crmStatus=pending) → gọi CRM → cập nhật crmStatus.

- CRM: Laravel do chủ dự án tự build. Endpoint: `CRM_API_URL` (vd `https://crm.../api/leads`),
  header `Authorization: Bearer ${CRM_API_TOKEN}` và `Idempotency-Key`.
- Payload gửi sang CRM: fullName, phone, email, programInterest, campus, locale, sourceUrl, utm*, gclid, fbclid, createdAt.
- Lỗi/timeout (5s): giữ `pending`, retry bằng Payload Jobs Queue (hoặc cron gọi endpoint nội bộ) với backoff;
  sau 5 lần → `failed` + gửi email cảnh báo tới `ALERT_EMAIL`. Không bao giờ mất lead.
- Thu UTM/gclid/fbclid từ URL lần đầu vào trang, lưu cookie first-party 30 ngày, gắn vào form.
- Nếu chưa có spec API CRM: viết `src/lib/crm.ts` với interface rõ ràng + mock, ghi TODO, KHÔNG bịa endpoint khác.

## 8. Chuyển dữ liệu từ WordPress — ĐÃ CHỐT

**Thời điểm: chỉ làm SAU KHI web (backend + frontend) đã hoàn thiện và test xong trên dữ liệu mẫu.**
Trước đó không viết script migrate, không kết nối DB WordPress. Mọi phát triển dùng dữ liệu seed (`pnpm seed`).

Nguồn: **đọc trực tiếp MySQL của WordPress** (bản dump khôi phục vào MySQL của Laragon) + bản sao thư mục
`wp-content/uploads` trên máy. Không cào HTML (chỉ dùng để đối soát).

Hiện trạng WP (khảo sát 25/11/2026):
- Plugin: Polylang (dịch), Rank Math (SEO), ACF, Contact Form 7, Smart Slider 3, WP Table Builder, kk Star Ratings.
- Post types & số URL trong sitemap: post 627, news 1.081 (63 EN), research 363, page 114 (57 EN), code 177,
  subjects 160, student 81, life 76, download 59, event 50, course 36, option 22, about 15, business 12,
  library 11, graduate 10, diplomas 8, international 8, admission 6, degrees 2. Media: 11.399.
- Taxonomies: category, post_tag, table_tags, các nhóm `list-*` (list-about, list-research, list-news, ...).

Ánh xạ (bảng chi tiết để ở `scripts/migrate/mapping.ts`, cần chủ dự án duyệt):
- post, news → `news` · event → `events` · course/degrees/diplomas/graduate → `programs` + `majors`
- subjects → `subjects` · research → `research` · download → `documents`
- page, about, life, student, business, option, international, library, admission → `pages`
- `code` → KHÔNG chuyển (mã nhúng; thay bằng block/GTM)
- revisions → không chuyển

Quy tắc script (`scripts/migrate/`, TypeScript, chạy `pnpm migrate [--only=news] [--since=ISO] [--dry-run]`):
1. Kết nối WP bằng `mysql2` (env `WP_DB_*`), ghi vào Payload bằng **Local API** (`getPayload`).
2. **Idempotent:** upsert theo `legacyId`; chạy lại không tạo trùng.
3. Xử lý theo lô 50 bản ghi; log tiến độ; lỗi một bản ghi không dừng cả lô (ghi vào `migrate-errors.jsonl`).
4. Nội dung: bỏ shortcode (`[video]`, …), inline style, markup kk-star-ratings, bảng WPTB → chuyển HTML sang Lexical.
   Ảnh trong nội dung: upload vào `media` (dedupe theo hash) rồi thay URL.
5. Polylang: ghép cặp vi/en qua taxonomy `post_translations` → một document, hai locale.
6. SEO: lấy `rank_math_title`, `rank_math_description`, `rank_math_focus_keyword` vào trường seo.
7. Media: toàn bộ uploads đi qua collection `media` (tự sinh WebP + sizes). Chạy ngoài giờ cao điểm, giới hạn đồng thời 2.
8. Xuất `redirects.csv` (legacy permalink → URL mới) và nạp vào collection redirects.
9. `pnpm migrate:verify`: so số lượng theo post type + locale giữa WP (SQL COUNT) và Payload; liệt kê link/ảnh hỏng.

## 9. SEO & khả năng AI đọc

- Mọi trang render HTML trên server (SSG/ISR, revalidate theo tag khi Payload publish). Không để nội dung chính chỉ có trong client JS.
- `generateMetadata` cho mọi route: title, description, canonical, hreflang vi/en/x-default (chỉ khi có đủ bản dịch), OG image 1200×630.
- JSON-LD sinh từ dữ liệu CMS: `CollegeOrUniversity` (kèm 5 cơ sở từ `campuses`), `Course`, `Event`, `NewsArticle`,
  `FAQPage`, `BreadcrumbList`. Không hard-code địa chỉ.
- Mỗi trang đúng một `h1`. Bảng dùng `<table>`. Ảnh luôn có alt.
- `sitemap.ts` tách theo locale; `robots.ts` cho phép Googlebot, GPTBot, ClaudeBot, PerplexityBot, Google-Extended; chặn `/admin`, `/api`, preview.
- `middleware.ts` tra bảng redirects (cache trong bộ nhớ, làm mới khi có thay đổi) → 301.
- Tin/sự kiện cũ (> 18 tháng) vào mục Lưu trữ, không lên trang chủ, vẫn index. Học phí ghi rõ năm học; năm cũ hiện nhãn "đã hết hiệu lực".

## 10. Hiệu năng & chất lượng

- Mục tiêu: Core Web Vitals "Good" trên mobile (LCP < 2,5s, CLS < 0,1, INP < 200ms); Lighthouse ≥ 90 mọi hạng mục.
- Server Components mặc định; `'use client'` chỉ khi cần tương tác.
- Một họ font, tối đa 3 độ đậm, `next/font` tự host, subset vietnamese.
- Không jQuery, không slider nặng; carousel dùng Embla (nếu cần).
- Tracking chỉ qua **một** GTM (`siteSettings.gtmId`), nạp sau tương tác/idle. Không nhúng Hotjar, Histats, dtscout, tynt, zzcdn, Lotame…
- Accessibility WCAG 2.2 AA: label cho mọi input, focus rõ ràng, tương phản đủ, điều hướng bàn phím.
- Ngân sách RAM production: app ≤ 2 GB tổng (2 instance), Postgres ~2 GB (1 GB khi WordPress còn chạy cùng máy).

## 11. Quy ước code

- TypeScript strict, không `any` (dùng `unknown` + narrow). Dùng type sinh bởi `payload generate:types`.
- Tên file kebab-case; component PascalCase; collection slug kebab-case số nhiều.
- Access control rõ ràng cho từng collection (roles: `admin`, `editor`, `admissions`).
- Không commit secret. Mọi cấu hình qua env, cập nhật `.env.example` khi thêm biến.
- Mỗi thay đổi schema → tạo migration Payload (`pnpm payload migrate:create`), không dùng `push` ở production.
- Commit nhỏ, message dạng Conventional Commits.
- Viết test cho: `lib/crm.ts`, `/api/leads`, các hàm transform trong `scripts/migrate`, JSON-LD builders.

## 12. Lệnh thường dùng

```
pnpm dev                     # chạy local
pnpm build && pnpm start     # build production
pnpm payload generate:types  # sinh type
pnpm payload migrate:create  # tạo migration DB
pnpm payload migrate         # chạy migration
pnpm lint && pnpm typecheck && pnpm test
pnpm test:e2e
pnpm seed                    # nạp dữ liệu mẫu (dùng suốt giai đoạn phát triển)
pnpm seed --reset            # xóa sạch rồi nạp lại dữ liệu mẫu
pnpm migrate --dry-run       # (giai đoạn migrate) thử chuyển dữ liệu WP
pnpm migrate:verify          # (giai đoạn migrate) đối soát
```

## 13. Biến môi trường (.env.example)

```
# Local (Windows + Laragon)
DATABASE_URL=postgres://swin:***@127.0.0.1:5432/swin
PAYLOAD_SECRET=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
MEDIA_DIR=./media
CRM_API_URL=
CRM_API_TOKEN=
ALERT_EMAIL=
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
# Chỉ dùng ở giai đoạn migrate (MySQL của Laragon)
WP_DB_HOST=127.0.0.1
WP_DB_PORT=3306
WP_DB_NAME=swin_wp
WP_DB_USER=root
WP_DB_PASSWORD=
WP_DB_PREFIX=wp_
WP_UPLOADS_DIR=C:\laragon\www\swin-wp\wp-content\uploads
```

Production đặt `NEXT_PUBLIC_SITE_URL=https://swinburne-vn.edu.vn`, `MEDIA_DIR=/var/www/swin/media`.

## 14. Định nghĩa "xong" cho mỗi task

1. `pnpm lint`, `pnpm typecheck`, `pnpm test` đều qua.
2. Không còn TODO không giải thích; TODO cần chủ dự án quyết định ghi rõ câu hỏi.
3. Nếu đụng giao diện: kiểm tra ở 375px và 1440px, cả `/` và `/en/`.
4. Nếu đụng schema: có migration, đã chạy `generate:types`.
5. Tóm tắt ngắn: đã làm gì, file nào đổi, cần chủ dự án kiểm tra gì.

## 15. Việc chưa chốt — hỏi trước khi làm

- Giao diện: giữ nguyên giao diện cũ (A), làm mới bố cục (B), hay hai đợt (C, đang nghiêng về C). Nếu chưa có quyết định: dựng component theo nhận diện hiện tại (màu, font, logo từ theme `swinburne`), giữ cấu trúc linh hoạt để đổi bố cục sau.
- Spec API của CRM Laravel (endpoint, field, mã lỗi).
- Form cũ có lưu lead trong DB không (plugin nào) — để chuyển lead cũ.
- Dung lượng ổ đĩa còn trống trên máy chủ FCI; WordPress cũ có chạy chung máy không.
