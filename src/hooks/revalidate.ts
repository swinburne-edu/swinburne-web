import { revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload'

import { cacheTags } from '@/lib/cache-tags'

/**
 * Gọi revalidateTag an toàn: ngoài runtime Next (seed, migrate, test) hàm này ném lỗi → bỏ qua.
 * Có thể tắt bằng req.context.disableRevalidate = true.
 */
export function safeRevalidate(tags: string[], req?: PayloadRequest): void {
  if (req?.context?.disableRevalidate) return
  for (const tag of tags) {
    try {
      revalidateTag(tag, 'max')
    } catch {
      // không chạy trong Next (vd. script seed) — không có cache để xoá
    }
  }
}

/** Hook afterChange/afterDelete: xoá cache theo collection + sitemap. */
export function revalidateCollection(collection: string, extraTags: string[] = []) {
  const tags = [cacheTags.collection(collection), cacheTags.sitemap, ...extraTags]

  const afterChange: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
    const status = (doc as { _status?: string })._status
    const prevStatus = (previousDoc as { _status?: string } | undefined)?._status
    // Chỉ revalidate khi bản xuất bản thay đổi (lưu nháp không ảnh hưởng trang công khai)
    if (status === undefined || status === 'published' || prevStatus === 'published') {
      safeRevalidate(tags, req)
    }
    return doc
  }

  const afterDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
    safeRevalidate(tags, req)
    return doc
  }

  return { afterChange: [afterChange], afterDelete: [afterDelete] }
}

export function revalidateGlobal(slug: string): GlobalAfterChangeHook {
  return ({ doc, req }) => {
    safeRevalidate([cacheTags.global(slug)], req)
    return doc
  }
}
