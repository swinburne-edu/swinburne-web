/** Tin/sự kiện cũ hơn 18 tháng vào mục Lưu trữ (CLAUDE.md mục 9). */
export const ARCHIVE_MONTHS = 18

export function archiveCutoff(now: Date = new Date()): Date {
  const d = new Date(now)
  d.setMonth(d.getMonth() - ARCHIVE_MONTHS)
  return d
}

export function isArchivedDate(
  date: string | Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!date) return false
  const t = new Date(date).getTime()
  if (Number.isNaN(t)) return false
  return t < archiveCutoff(now).getTime()
}
