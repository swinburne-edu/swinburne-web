/**
 * Tạo slug URL từ chuỗi tiếng Việt/Anh: bỏ dấu, đ → d, chữ thường, nối bằng "-".
 * "Đăng ký Tư vấn 2026!" → "dang-ky-tu-van-2026"
 */
export function slugify(input: string, maxLength = 120): string {
  const slug = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (slug.length <= maxLength) return slug
  const cut = slug.slice(0, maxLength)
  const lastDash = cut.lastIndexOf('-')
  return (lastDash > maxLength / 2 ? cut.slice(0, lastDash) : cut).replace(/-+$/g, '')
}
