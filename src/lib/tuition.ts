/**
 * Năm học bắt đầu từ tháng 9. Ví dụ ngày 25/11/2026 thuộc năm học 2026-2027;
 * học phí ghi "2025-2026" là đã hết hiệu lực.
 */
export const ACADEMIC_YEAR_START_MONTH = 9 // tháng 9

export function currentAcademicStartYear(now: Date = new Date()): number {
  const month = now.getMonth() + 1
  return month >= ACADEMIC_YEAR_START_MONTH ? now.getFullYear() : now.getFullYear() - 1
}

export function parseAcademicYear(value: string): { start: number; end: number } | null {
  const m = /^(\d{4})\s*[-–/]\s*(\d{4})$/.exec(value.trim())
  if (!m) return null
  const start = Number(m[1])
  const end = Number(m[2])
  return end === start + 1 ? { start, end } : null
}

export function isTuitionExpired(academicYear: string, now: Date = new Date()): boolean {
  const parsed = parseAcademicYear(academicYear)
  if (!parsed) return false
  return parsed.start < currentAcademicStartYear(now)
}

export function formatMoney(amount: number, currency: string, locale: 'vi' | 'en'): string {
  try {
    return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'VND' ? 0 : 2,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString()} ${currency}`
  }
}

type TuitionRow = {
  academicYear: string
  amount: number
  currency?: string | null
  note?: string | null
  id?: string | null
}

/** Năm mới nhất lên trước */
export function sortTuition<T extends TuitionRow>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) =>
      (parseAcademicYear(b.academicYear)?.start ?? 0) -
      (parseAcademicYear(a.academicYear)?.start ?? 0),
  )
}
