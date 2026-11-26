#!/usr/bin/env bash
# Chuẩn bị máy chủ FCI — Ubuntu 24.04, KHÔNG Docker (CLAUDE.md mục 3, PROMPTS.md T2).
# Chạy bằng root: sudo bash setup-ubuntu.sh
# Idempotent: chạy lại nhiều lần không hỏng gì.
#
# Biến tuỳ chọn:
#   DB_PASS_PROD, DB_PASS_STAGING   mật khẩu DB (bỏ trống → sinh ngẫu nhiên, in ra 1 lần)
#   DEPLOY_PUBKEY                   public key SSH của GitHub Actions cho user swin
set -euo pipefail

if [[ $EUID -ne 0 ]]; then echo "Cần chạy bằng sudo/root"; exit 1; fi

export DEBIAN_FRONTEND=noninteractive
APP_USER=swin

log() { echo -e "\n==> $*"; }

log "Cập nhật hệ thống + gói cơ bản"
apt-get update -y
apt-get install -y ca-certificates curl gnupg ufw fail2ban unattended-upgrades rsync restic apache2-utils

log "Node.js 22 LTS (NodeSource)"
if ! command -v node >/dev/null || [[ "$(node -v)" != v22* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
corepack enable
npm install -g pm2@latest

log "PostgreSQL 16 (chỉ nghe localhost)"
if ! command -v psql >/dev/null; then
  install -d /usr/share/postgresql-common/pgdg
  curl -fsSL -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc https://www.postgresql.org/media/keys/ACCC4CF8.asc
  echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt noble-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list
  apt-get update -y
  apt-get install -y postgresql-16
fi
PG_CONF=/etc/postgresql/16/main/postgresql.conf
sed -i "s/^#\?listen_addresses.*/listen_addresses = 'localhost'/" "$PG_CONF"
systemctl enable --now postgresql
systemctl restart postgresql

log "Nginx + Certbot"
apt-get install -y nginx certbot python3-certbot-nginx
install -d /var/www/certbot
cat > /etc/nginx/snippets/swin-proxy.conf <<'EOF'
proxy_http_version 1.1;
proxy_set_header Connection "";
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_read_timeout 60s;
EOF
systemctl enable --now nginx

log "User hệ thống ${APP_USER}"
if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash "$APP_USER"
fi
if [[ -n "${DEPLOY_PUBKEY:-}" ]]; then
  install -d -m 700 -o "$APP_USER" -g "$APP_USER" "/home/${APP_USER}/.ssh"
  grep -qxF "$DEPLOY_PUBKEY" "/home/${APP_USER}/.ssh/authorized_keys" 2>/dev/null \
    || echo "$DEPLOY_PUBKEY" >> "/home/${APP_USER}/.ssh/authorized_keys"
  chown "$APP_USER:$APP_USER" "/home/${APP_USER}/.ssh/authorized_keys"
  chmod 600 "/home/${APP_USER}/.ssh/authorized_keys"
fi

log "Thư mục ứng dụng"
for root in /var/www/swin /var/www/swin-staging; do
  install -d -o "$APP_USER" -g "$APP_USER" "$root" "$root/app" "$root/app/releases" "$root/media" "$root/shared" "$root/logs"
done
install -d -o "$APP_USER" -g "$APP_USER" /var/backups/swin

log "Database production + staging"
gen_pass() { tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32; }
create_db() {
  local db="$1" user="$2" pass="$3"
  if ! sudo -u postgres psql -tAc "select 1 from pg_roles where rolname='${user}'" | grep -q 1; then
    sudo -u postgres psql -c "create role ${user} login password '${pass}';"
    echo "    Tạo role ${user} — mật khẩu: ${pass}  (ghi vào ${4}/shared/.env, không in lại)"
  fi
  if ! sudo -u postgres psql -tAc "select 1 from pg_database where datname='${db}'" | grep -q 1; then
    sudo -u postgres createdb -O "$user" -E UTF8 -T template0 "$db"
  fi
}
create_db swin swin "${DB_PASS_PROD:-$(gen_pass)}" /var/www/swin
create_db swin_staging swin_staging "${DB_PASS_STAGING:-$(gen_pass)}" /var/www/swin-staging

log "PM2 tự khởi động cùng hệ thống (user ${APP_USER})"
env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$APP_USER" --hp "/home/${APP_USER}" >/dev/null

log "Tường lửa ufw (22/80/443)"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

log "fail2ban + unattended-upgrades"
cat > /etc/fail2ban/jail.d/swin.local <<'EOF'
[sshd]
enabled = true
maxretry = 5
bantime = 1h
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban
dpkg-reconfigure -f noninteractive unattended-upgrades

log "Hoàn tất. Việc tiếp theo (xem deploy/README.md):"
echo "  1. Tạo /var/www/swin/shared/.env và /var/www/swin-staging/shared/.env (chmod 600, owner ${APP_USER})"
echo "  2. Chép deploy/nginx.conf → /etc/nginx/sites-available/swin, bật site, chạy certbot"
echo "  3. Thêm secret SSH vào GitHub Actions và chạy workflow deploy"
