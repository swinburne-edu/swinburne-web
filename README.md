# swinburne-vn.edu.vn

Website Swinburne Vietnam Alliance Program — Next.js 16 (App Router) + Payload CMS 3.91 + PostgreSQL.
Bối cảnh, quy ước và các quyết định đã chốt: [CLAUDE.md](CLAUDE.md). Lộ trình: [PROMPTS.md](PROMPTS.md).
Triển khai máy chủ: [deploy/README.md](deploy/README.md).

## Chạy local (Windows + Laragon)

```powershell
corepack enable
pnpm install
copy .env.example .env      # rồi điền DATABASE_URL, PAYLOAD_SECRET
pnpm check-env              # kiểm tra Node 22, pnpm, kết nối Postgres
pnpm payload migrate        # tạo bảng
pnpm seed --reset           # dữ liệu mẫu (~30 giây)
pnpm dev                    # http://localhost:3000 — admin: /admin (tạo admin đầu tiên)
```

Test luồng lead: chạy `pnpm mock-crm` (cổng 4010) và đặt `CRM_API_URL=http://127.0.0.1:4010/api/leads`,
`CRM_API_TOKEN=local-dev-token` trong `.env`.

## Lệnh

| Lệnh | Việc |
|---|---|
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Kiểm tra chất lượng (test tích hợp dùng `TEST_DATABASE_URL`) |
| `pnpm test:e2e` | Playwright (`E2E_CHANNEL=chrome` để dùng Chrome có sẵn) |
| `pnpm build` → `pnpm start:standalone` | Chạy thử bản production standalone |
| `pnpm payload migrate:create <tên>` | Tạo migration sau khi đổi schema, rồi `pnpm generate:types` |

## Cấu trúc chính

- `src/collections`, `src/globals`, `src/blocks/configs.ts` — schema CMS (mục 5)
- `src/app/(frontend)/[locale]/…` — trang công khai; `src/proxy.ts` dịch URL `/tin-tuc/x` ↔ `/vi/news/x`, tra redirect
- `src/app/api/leads/route.ts`, `src/lib/leads/*`, `src/lib/crm.ts`, `src/jobs/crm-sync.ts` — form → lead → CRM + retry
- `src/lib/seo/*` — metadata, JSON-LD; `src/app/sitemap.xml`, `src/app/sitemaps/[file]`, `src/app/robots.ts`
- `scripts/seed`, `scripts/mock-crm.ts`, `scripts/check-env.ts`
- `deploy/` — PM2, Nginx, backup, setup Ubuntu; `.github/workflows/` — CI và deploy
