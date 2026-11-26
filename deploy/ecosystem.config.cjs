/**
 * PM2 — máy chủ FCI (Ubuntu 24.04, không Docker). CLAUDE.md mục 3.
 *
 *   pm2 startOrReload /var/www/swin/app/current/deploy/ecosystem.config.cjs --only swin
 *   pm2 startOrReload /var/www/swin-staging/app/current/deploy/ecosystem.config.cjs --only swin-staging
 *
 * Bản build standalone nằm ở <release>/server.js. Biến môi trường nạp từ shared/.env
 * bằng cờ --env-file của Node 22 (không commit .env).
 * Ngân sách RAM: app ≤ 2 GB tổng → production 2 × 900 MB, staging 1 × 600 MB.
 */
const app = (name, root, instances, maxMemory, port) => ({
  name,
  cwd: `${root}/app/current`,
  script: 'server.js',
  node_args: [`--env-file=${root}/shared/.env`, `--max-old-space-size=${parseInt(maxMemory, 10) - 100}`],
  exec_mode: 'cluster',
  instances,
  max_memory_restart: maxMemory,
  kill_timeout: 10000,
  listen_timeout: 30000,
  env: {
    NODE_ENV: 'production',
    PORT: String(port),
    // "localhost" (không phải 127.0.0.1): Next dựng URL nội bộ cho proxy.ts bằng "localhost";
    // bind bằng IP làm rewrite bị coi là URL ngoài → vòng lặp redirect. Vẫn chỉ nghe loopback.
    HOSTNAME: 'localhost',
    INTERNAL_URL: `http://localhost:${port}`,
  },
  out_file: `${root}/logs/out.log`,
  error_file: `${root}/logs/error.log`,
  merge_logs: true,
  time: true,
})

module.exports = {
  apps: [
    app('swin', '/var/www/swin', 2, '900M', 3000),
    app('swin-staging', '/var/www/swin-staging', 1, '600M', 3100),
  ],
}
