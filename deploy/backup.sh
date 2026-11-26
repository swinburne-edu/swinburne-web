#!/usr/bin/env bash
# Sao lưu hằng đêm: pg_dump DB + restic thư mục media. Giữ 30 ngày.
# Chỉ chạy trên máy chủ (Ubuntu). Cron (user swin):
#   15 2 * * * /var/www/swin/app/current/deploy/backup.sh >> /var/www/swin/logs/backup.log 2>&1
#
# Cần: /var/www/swin/shared/backup.env chứa
#   PGDATABASE=swin  PGUSER=swin  PGHOST=127.0.0.1  PGPASSWORD=...
#   RESTIC_REPOSITORY=/var/backups/swin/restic   (hoặc sftp:/s3: ngoài máy chủ — khuyến nghị)
#   RESTIC_PASSWORD=...
set -euo pipefail

ENV_FILE="${BACKUP_ENV_FILE:-/var/www/swin/shared/backup.env}"
# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

BACKUP_DIR="${BACKUP_DIR:-/var/backups/swin/db}"
MEDIA_DIR="${MEDIA_DIR:-/var/www/swin/media}"
KEEP_DAYS="${KEEP_DAYS:-30}"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

echo "[$(date -Is)] pg_dump ${PGDATABASE}"
pg_dump --format=custom --no-owner --file="${BACKUP_DIR}/${PGDATABASE}-${STAMP}.dump"
find "$BACKUP_DIR" -name "${PGDATABASE}-*.dump" -mtime +"$KEEP_DAYS" -delete

echo "[$(date -Is)] restic media"
if ! restic snapshots >/dev/null 2>&1; then
  restic init
fi
restic backup "$MEDIA_DIR" --tag media --quiet
restic forget --tag media --keep-daily "$KEEP_DAYS" --prune --quiet

echo "[$(date -Is)] xong"
