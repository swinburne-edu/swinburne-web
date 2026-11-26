# PROMPTS.md — Lộ trình vibe code với Claude

Thứ tự: **Backend → Frontend → Test & staging → Migrate dữ liệu → Go-live.**
Web được làm xong và test xong trên dữ liệu mẫu, rồi mới chuyển dữ liệu thật từ WordPress.

Môi trường: lập trình trên **Windows + Laragon**, production là **Ubuntu 24.04 (FCI), không Docker**.

Cách dùng: đặt `CLAUDE.md` và file này vào `C:\laragon\www\swinburne.edu.vn`, mở Claude Code tại thư mục đó. Mỗi bước dán một prompt vào Claude Code,
đợi xong, tự kiểm tra theo mục "Nghiệm thu", commit, rồi mới sang bước sau.
Mỗi bước nên là một phiên làm việc riêng, bắt đầu bằng: "Đọc CLAUDE.md trước."

Mẹo:
- Ở bước lớn, yêu cầu "Lập kế hoạch trước, chờ tôi duyệt rồi mới code".
- Khi Claude đề xuất đổi thứ đã chốt (Docker, MySQL cho Payload, migrate sớm…), trả lời: "Không, theo CLAUDE.md."
- Sau mỗi bước: `pnpm lint && pnpm typecheck && pnpm test`.

---

# GIAI ĐOẠN 0 — CHUẨN BỊ MÁY WINDOWS

## P0 — Môi trường Laragon

```
Đọc CLAUDE.md mục 3b. Hướng dẫn tôi từng bước (lệnh PowerShell) để chuẩn bị máy Windows dùng
Laragon: kiểm tra Node 22 và bật corepack/pnpm, thêm PostgreSQL 16 (qua Laragon Quick add nếu có,
không thì bản cài cho Windows), tạo DB swin và user swin, cài Git for Windows, cấu hình git
core.autocrlf=false. Viết scripts/check-env.ts kiểm tra các điều kiện này (phiên bản Node, pnpm,
kết nối Postgres) và in kết quả rõ ràng. Chưa khởi tạo dự án.
```
Nghiệm thu: `pnpm tsx scripts/check-env.ts` báo đủ: Node 22, pnpm, kết nối được Postgres.

---

# GIAI ĐOẠN 1 — BACKEND (dữ liệu mẫu)

## B1 — Khởi tạo dự án Payload

```
Đọc CLAUDE.md. Khởi tạo dự án ngay trong thư mục hiện tại C:\laragon\www\swinburne.edu.vn (đã có
CLAUDE.md, PROMPTS.md; nếu create-payload-app đòi thư mục trống thì tạo ở thư mục tạm rồi chuyển
file vào, giữ nguyên 2 file này). Dùng create-payload-app (template blank, Postgres), pnpm,
TypeScript strict, Tailwind. Kiểm tra phiên bản Payload và Next.js ổn định mới nhất, dùng docs đúng
phiên bản. Tạo cấu trúc thư mục như mục 4, .env.example như mục 13, .gitattributes (LF), ESLint +
Prettier, Vitest, Playwright, cross-env, rimraf, tsx. Cấu hình localization vi (mặc định) và en.
Collection users có roles admin/editor/admissions. Route công khai chỉ để trang tạm "Đang xây dựng".
Mọi script package.json phải chạy được trên Windows và Ubuntu. Lập kế hoạch trước, chờ tôi duyệt.
```
Nghiệm thu: trên Windows, `pnpm dev` chạy; vào `http://localhost:3000/admin` tạo được admin.

## B2 — Collection media

```
Đọc CLAUDE.md mục 6. Tạo collection media đúng cấu hình (WebP, 4 size, mỗi size khai formatOptions,
focal point, alt bắt buộc localized, withMetadata false, staticDir lấy từ MEDIA_DIR qua path.resolve).
Viết test upload JPG và PNG: file gốc và các size đều là .webp, chiều rộng gốc không quá 2560.
SVG và PDF giữ nguyên.
```
Nghiệm thu: upload ảnh trong admin → thư mục `media` chỉ có .webp (trừ SVG/PDF), đủ 4 size.

## B3 — Toàn bộ collection, globals, phân quyền

```
Đọc CLAUDE.md mục 5. Tạo categories, tags, programs, majors, subjects, campuses, news, events,
research, people, testimonials, faqs, documents, pages (blocks), leads; globals header, footer,
siteSettings. Tất cả có slug, legacyId, legacyUrl (để dành cho giai đoạn migrate), versions/drafts
(trừ leads). Access control theo roles. Thêm plugin-seo và plugin-redirects. Admin dễ dùng cho biên
tập viên: nhóm menu, cột hiển thị, mô tả trường bằng tiếng Việt. Tạo migration DB, generate types.
```
Nghiệm thu: admin đủ collection; nhập thử 1 program có bản vi/en; nháp → xuất bản chạy đúng.

## B4 — Dữ liệu mẫu (seed)

```
Viết scripts/seed (chạy bằng pnpm seed, có --reset) tạo dữ liệu mẫu đủ để dựng và test giao diện:
5 cơ sở thật (bảng mục 5), menu 7 mục, 2 program (Cử nhân, MBA) với 16 ngành thật theo menu hiện
tại (Phân tích kinh doanh, Marketing, Kinh doanh quốc tế, Quản trị kinh doanh, Tài chính, Logistics
và Quản lý chuỗi cung ứng, Trí tuệ nhân tạo, Khoa học dữ liệu, Phát triển phần mềm, IoT, An ninh mạng,
Quan hệ công chúng, Quảng cáo, Truyền thông xã hội, Thiết kế truyền thông, Thiết kế trải nghiệm và
tương tác người dùng), 30 tin tức (có bài cũ hơn 18 tháng để test mục Lưu trữ, có bài thiếu bản en),
8 sự kiện (sắp tới và đã qua), 10 FAQ, 5 cảm nhận, 6 giảng viên, trang chủ và trang Về chúng tôi bằng
blocks. Nội dung mẫu ghi rõ là mẫu, không bịa số liệu học phí thật (dùng giá trị giả có nhãn "mẫu").
Ảnh mẫu tạo bằng sharp (khối màu có chữ), đi qua collection media. Gồm cả ca khó: tiêu đề rất dài,
bài không có ảnh, bài chỉ có bản vi.
```
Nghiệm thu: `pnpm seed --reset` chạy trên Windows < 2 phút; admin có đủ dữ liệu như mô tả.

## B5 — API nhận lead & CRM Laravel

```
Đọc CLAUDE.md mục 7. Viết route POST /api/leads: validate Zod, verify Turnstile, lưu lead trước,
gọi CRM qua lib/crm.ts (timeout 5s, Idempotency-Key), retry bằng Jobs Queue với backoff, 5 lần thất
bại thì đánh dấu failed và gửi email cảnh báo. Test cho route và crm client (mock CRM). Thêm một
mock CRM server nhỏ (scripts/mock-crm.ts) để test local trên Windows. Nếu chưa có spec API CRM thì
dùng interface + mock và liệt kê câu hỏi cho tôi.
```
Nghiệm thu: gửi lead (PowerShell `Invoke-RestMethod`) khi mock CRM tắt → `pending`; bật → tự chuyển `sent`.

## B6 — Thư viện SEO phía backend

```
Đọc CLAUDE.md mục 9. Viết lib/seo/jsonld.ts sinh CollegeOrUniversity (5 cơ sở), Course, Event,
NewsArticle, FAQPage, BreadcrumbList từ dữ liệu Payload; lib/seo/metadata.ts dựng title, description,
canonical, hreflang, OG từ trường seo. Thêm hook afterChange gọi revalidateTag theo collection.
Unit test với dữ liệu seed.
```
Nghiệm thu: test qua; JSON-LD sinh ra hợp lệ khi dán vào Schema Markup Validator.

---

# GIAI ĐOẠN 2 — FRONTEND (dữ liệu mẫu)

## F1 — Design tokens & khung trang

```
Đọc CLAUDE.md mục 5, 10, 15. Thiết lập design tokens trong Tailwind theo nhận diện Swinburne
(màu, font qua next/font subset vietnamese, khoảng cách, bo góc). Dựng routing vi không tiền tố, en
dưới /en. Layout chung: Header (menu từ global header, nút "Đăng ký tư vấn" cố định), Footer (từ
campuses và global footer), chuyển ngôn ngữ giữ đúng trang tương ứng. Làm component cơ bản (Button,
Card, Section, Container, Breadcrumb, Pagination) và trang /styleguide nội bộ (noindex).
```
Nghiệm thu: `/` và `/en` có header/footer đúng; 375px và 1440px đều ổn; /styleguide đủ component.

## F2 — Block renderer & trang chủ

```
Viết renderer cho các block của pages (Hero, RichText, CardGrid, CTA, FAQList, LeadForm, Video,
Table, Stats, Testimonials) và rich text Lexical. Dựng trang chủ bằng page builder: chương trình nổi
bật, lý do chọn, tin mới (không lấy bài lưu trữ), sự kiện sắp tới, cảm nhận, CTA. Ảnh dùng size đã sinh
qua srcset, không để Next tối ưu lại. Đúng một h1.
```
Nghiệm thu: đổi thứ tự block trong admin → publish → trang chủ cập nhật.

## F3 — Trang chi tiết & danh sách

```
Dựng route chương trình, ngành, cơ sở, tin tức (phân trang, lọc chuyên mục, mục Lưu trữ), sự kiện
(sắp diễn ra / đã qua), nghiên cứu, pages động. Dùng lib/seo/metadata.ts và jsonld.ts, ISR +
revalidateTag. Học phí theo năm học, năm cũ có nhãn "đã hết hiệu lực". Trang 404 song ngữ.
Xử lý tốt các ca khó trong seed (tiêu đề dài, không ảnh, thiếu bản en).
```
Nghiệm thu: duyệt toàn bộ dữ liệu seed không lỗi giao diện; view-source thấy đủ nội dung.

## F4 — Form đăng ký

```
Đọc CLAUDE.md mục 7. Tạo component LeadForm (React Hook Form + Zod + Turnstile, dùng test key ở
local), thu UTM/gclid/fbclid vào cookie 30 ngày, gửi tới /api/leads. Trạng thái gửi, lỗi, cảm ơn; đủ
label và thông báo lỗi cho trình đọc màn hình. Gắn vào nút CTA header, trang chương trình, block LeadForm.
```
Nghiệm thu: gửi form local → lead có trong admin và trong mock CRM, đủ UTM.

## F5 — SEO kỹ thuật phía frontend

```
Đọc CLAUDE.md mục 9. sitemap.ts tách theo locale, robots.ts đúng danh sách bot, middleware.ts tra
collection redirects (cache, làm mới khi đổi) trả 301, hreflang chỉ khi đủ bản dịch, ảnh OG mặc định.
GTM nạp một lần từ siteSettings, sau tương tác/idle. Test redirect bằng vài bản ghi mẫu.
```
Nghiệm thu: `/robots.txt`, `/sitemap.xml` đúng; redirect mẫu trả 301.

---

# GIAI ĐOẠN 3 — TEST & STAGING (vẫn dữ liệu mẫu)

## T1 — Test tự động, hiệu năng, accessibility

```
Đọc CLAUDE.md mục 10 và 14. Viết Playwright e2e: điều hướng menu, đổi ngôn ngữ, danh sách + phân
trang tin tức, gửi form (mock CRM), redirect, 404. Chạy Lighthouse mobile cho trang chủ, 1 chương
trình, 1 tin tức, cả vi và en; sửa đến khi ≥ 90 mọi hạng mục. Kiểm tra axe và sửa. GitHub Actions
chạy lint, typecheck, unit, e2e, Lighthouse CI trên Ubuntu runner.
```
Nghiệm thu: CI xanh trên GitHub; Lighthouse ≥ 90.

## T2 — Chuẩn bị máy chủ FCI

```
Đọc CLAUDE.md mục 3. Viết deploy/setup-ubuntu.sh cho Ubuntu 24.04 (không Docker): Node.js 22,
corepack + pnpm, PM2, PostgreSQL 16, Nginx, Certbot, ufw (22/80/443), fail2ban, unattended-upgrades;
user hệ thống swin; DB production + staging; thư mục /var/www/swin/{app,media} và
/var/www/swin-staging/{app,media}. Script idempotent, file LF. Viết deploy/README.md: cách chép
script từ Windows lên máy chủ (scp / WinSCP) và chạy.
```
Nghiệm thu: chạy script thành công; `psql` vào được 2 DB; `nginx -t` OK.

## T3 — Deploy staging & kiểm thử người dùng

```
Viết deploy/ecosystem.config.cjs (PM2; production 2 instance, staging 1), deploy/nginx.conf
(reverse proxy, /media phục vụ trực tiếp, cache dài, gzip, header bảo mật; staging noindex + basic
auth), deploy/backup.sh (pg_dump hằng đêm + restic media, giữ 30 ngày), .github/workflows/deploy.yml
(build standalone trên runner, rsync, payload migrate, pm2 reload). Deploy staging, chạy seed trên
staging. Lập checklist kiểm thử người dùng (UAT) cho phòng Truyền thông và Tuyển sinh: đăng bài,
sửa trang chủ, upload ảnh, xem lead.
```
Nghiệm thu: staging chạy qua HTTPS; biên tập viên làm hết checklist UAT; sửa xong các lỗi phát hiện.

**Mốc quan trọng:** web đã hoàn thiện và được duyệt trên dữ liệu mẫu. Chỉ sau mốc này mới sang giai đoạn 4.

---

# GIAI ĐOẠN 4 — MIGRATE DỮ LIỆU WORDPRESS

## M1 — Khôi phục WordPress trên Laragon & khảo sát

```
Đọc CLAUDE.md mục 8. Hướng dẫn tôi (PowerShell) khôi phục bản dump WordPress vào MySQL của Laragon
(DB swin_wp) và chép uploads về máy. Viết scripts/migrate/inspect.ts: in số bài theo post_type +
post_status + ngôn ngữ Polylang; meta_key kèm số lần dùng theo post_type; taxonomy và số term; bảng
plugin lưu form (nếu có). Xuất inspect-report.md. Chưa ghi gì vào Payload. Xong thì dừng, gửi báo cáo
và đề xuất bảng ánh xạ.
```
Nghiệm thu: bạn duyệt bảng ánh xạ (post type → collection, meta_key → field).

## M2 — Script chuyển dữ liệu

```
Đọc CLAUDE.md mục 8 và bảng ánh xạ đã duyệt. Viết scripts/migrate: mapping.ts, transform HTML →
Lexical, ghép Polylang, upload media dedupe theo hash, upsert theo legacyId, lô 50, --only/--since/
--dry-run, ghi lỗi ra migrate-errors.jsonl, xuất redirects.csv và nạp collection redirects. Đường dẫn
uploads lấy từ WP_UPLOADS_DIR (Windows). Chạy trên DB local riêng (swin_migrate), không đụng dữ liệu
seed. Bắt đầu với news: dry-run 50 bài, cho tôi xem 5 bài mẫu. Test cho các hàm transform.
```
Sau khi duyệt mẫu:
```
Mở rộng cho toàn bộ post type, media và lead cũ (nếu có; đẩy sang CRM với nguồn "website cũ").
Viết pnpm migrate:verify so số lượng theo post type và locale, liệt kê ảnh/link hỏng.
```
Nghiệm thu: verify khớp số lượng trên local.

## M3 — Test lại web trên dữ liệu thật

```
Trỏ app local vào DB đã migrate. Chạy lại toàn bộ e2e và Lighthouse. Duyệt ngẫu nhiên 5% bài, đặt
cạnh trang cũ; kiểm tra 50 URL ngẫu nhiên từ redirects.csv trả 301 đúng trang. Liệt kê và sửa lỗi giao
diện chỉ xuất hiện với nội dung thật (HTML lạ, ảnh tỉ lệ bất thường, bảng rộng, bài rất dài).
Sau đó chạy migrate lên staging để UAT lần 2.
```
Nghiệm thu: e2e + Lighthouse vẫn đạt; UAT lần 2 trên staging được duyệt.

---

# GIAI ĐOẠN 5 — GO-LIVE

## G1 — Chạy thật

```
Lập và thực hiện checklist go-live: sao lưu cuối WordPress, đóng băng đăng bài WP 24–48 giờ,
migrate --since lần cuối lên production, migrate:verify, nạp redirects, deploy production, chuyển
Nginx/DNS, gửi sitemap lên Search Console, theo dõi 404 hằng ngày trong 4 tuần, phương án quay lui
về WordPress nếu sự cố.
```
