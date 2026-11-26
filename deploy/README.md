# Triển khai lên máy chủ FCI (Ubuntu 24.04, không Docker)

Kiến trúc: Nginx (TLS, phục vụ `/media`) → PM2 cluster (Next.js standalone) → PostgreSQL 16 (localhost).
Build chạy trên GitHub Actions, **không build trên máy chủ**.

```
/var/www/swin/                  (staging: /var/www/swin-staging/)
├─ app/
│  ├─ releases/<git-sha>/       bản build standalone (server.js, .next/, deploy/)
│  └─ current -> releases/<sha> symlink, PM2 chạy từ đây
├─ media/                       MEDIA_DIR (Nginx phục vụ trực tiếp)
├─ shared/.env                  biến môi trường (chmod 600)
├─ shared/backup.env            biến cho backup.sh
└─ logs/
```

## 1. Chuẩn bị máy chủ (một lần)

Từ Windows (PowerShell), chép script lên máy chủ (hoặc dùng WinSCP kéo thả vào `/tmp/`):

```powershell
scp deploy/setup-ubuntu.sh user@IP_MAY_CHU:/tmp/
```

Trên máy chủ:

```bash
sudo DEPLOY_PUBKEY="ssh-ed25519 AAAA... github-actions" bash /tmp/setup-ubuntu.sh
```

Script in mật khẩu DB **một lần** — ghi ngay vào `shared/.env`.
Kiểm tra: `psql -h 127.0.0.1 -U swin swin -c 'select 1'` và `sudo nginx -t`.

## 2. Biến môi trường

`/var/www/swin/shared/.env` (owner `swin`, `chmod 600`) — đủ các biến trong `.env.example` ở gốc repo:

```bash
DATABASE_URL=postgres://swin:<mật khẩu>@127.0.0.1:5432/swin
PAYLOAD_SECRET=<openssl rand -hex 32>
NEXT_PUBLIC_SITE_URL=https://swinburne-vn.edu.vn
MEDIA_DIR=/var/www/swin/media
CRM_API_URL=...
CRM_API_TOKEN=...
ALERT_EMAIL=...
TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
```

Staging: `NEXT_PUBLIC_SITE_URL=https://staging.swinburne-vn.edu.vn`, `MEDIA_DIR=/var/www/swin-staging/media`,
`NOINDEX=true`, DB `swin_staging`.

> `NEXT_PUBLIC_SITE_URL` được nhúng lúc build → cũng phải đặt trong GitHub Environment variables (mục 4).

## 3. Nginx + HTTPS

```bash
sudo cp /var/www/swin/app/current/deploy/nginx.conf /etc/nginx/sites-available/swin
sudo ln -sf /etc/nginx/sites-available/swin /etc/nginx/sites-enabled/swin
sudo htpasswd -c /etc/nginx/.htpasswd-swin-staging <tên>
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d swinburne-vn.edu.vn -d www.swinburne-vn.edu.vn -d staging.swinburne-vn.edu.vn
```

## 4. GitHub Actions (`.github/workflows/deploy.yml`)

Tạo 2 Environment `production` và `staging` trong Settings của repo:

| Loại | Tên | Ví dụ |
|---|---|---|
| secret | `SSH_HOST` | IP/hostname máy chủ |
| secret | `SSH_USER` | `swin` |
| secret | `SSH_PRIVATE_KEY` | private key ứng với `DEPLOY_PUBKEY` |
| secret | `SSH_KNOWN_HOSTS` | kết quả `ssh-keyscan IP_MAY_CHU` |
| variable | `SITE_URL` | `https://swinburne-vn.edu.vn` |
| variable | `APP_ROOT` | `/var/www/swin` (staging: `/var/www/swin-staging`) |
| variable | `PM2_APP` | `swin` (staging: `swin-staging`) |
| variable | `APP_PORT` | `3000` (staging: `3100`) — khớp `deploy/ecosystem.config.cjs` |

Đẩy lên nhánh `staging` → deploy staging; `main` → production (hoặc chạy tay "Run workflow").

Migration DB chạy tự động khi instance 0 khởi động (`prodMigrations` trong `src/payload.config.ts`);
`pm2 reload` khởi động lại instance 0 trước, instance còn lại vẫn phục vụ trong lúc đó.

## 5. Seed dữ liệu mẫu trên staging

Bản standalone không kèm `tsx`. Chạy seed từ máy local qua SSH tunnel tới DB staging:

```powershell
ssh -N -L 15432:127.0.0.1:5432 swin@IP_MAY_CHU
```

Ở terminal khác (trong repo):

```powershell
$env:DATABASE_URL="postgres://swin_staging:<mk>@127.0.0.1:15432/swin_staging"; $env:MEDIA_DIR="./media-staging"; pnpm seed --reset
```

Rồi chép ảnh đã sinh lên máy chủ:

```powershell
scp -r ./media-staging/* swin@IP_MAY_CHU:/var/www/swin-staging/media/
```

## 6. Sao lưu

```bash
sudo -u swin crontab -e
# 15 2 * * * /var/www/swin/app/current/deploy/backup.sh >> /var/www/swin/logs/backup.log 2>&1
```

Khôi phục DB: `pg_restore --clean --no-owner -d swin /var/backups/swin/db/swin-<ngày>.dump`.
Khôi phục media: `restic restore latest --tag media --target /`.

## 7. Quay lui

```bash
cd /var/www/swin/app && ls releases/
ln -sfn releases/<sha-cũ> current && pm2 reload swin
```

Migration DB không tự quay lui — nếu bản mới có migration, khôi phục DB từ bản dump trước khi deploy.
