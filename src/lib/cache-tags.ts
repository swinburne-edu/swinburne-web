/** Tag dùng cho unstable_cache / revalidateTag. Giữ tập trung để hook và truy vấn khớp nhau. */
export const cacheTags = {
  collection: (slug: string) => `collection:${slug}`,
  global: (slug: string) => `global:${slug}`,
  sitemap: 'sitemap',
  redirects: 'redirects',
} as const
