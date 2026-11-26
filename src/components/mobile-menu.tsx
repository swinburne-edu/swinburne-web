'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useState } from 'react'

import type { NavItem } from './header'

type Props = {
  items: NavItem[]
  labels: { menu: string; close: string }
}

/** Menu di động: nút mở/đóng + danh sách mục, đóng khi đổi trang hoặc bấm Esc. */
export function MobileMenu({ items, labels }: Props) {
  const pathname = usePathname()
  // Lưu pathname lúc mở: đổi trang → pathname khác → menu tự đóng (không cần effect)
  const [openAt, setOpenAt] = useState<string | null>(null)
  const open = openAt === pathname
  const setOpen = (value: boolean | ((v: boolean) => boolean)) => {
    const next = typeof value === 'function' ? value(open) : value
    setOpenAt(next ? pathname : null)
  }
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenAt(null)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="xl:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? labels.close : labels.menu}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line"
      >
        <svg
          aria-hidden="true"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
        </svg>
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="fixed inset-x-0 top-16 bottom-0 z-50 overflow-y-auto border-t border-line bg-white lg:top-20"
      >
        <nav aria-label={labels.menu} className="container-site py-4">
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li key={item.label} className="py-2">
                {item.url ? (
                  <Link href={item.url} className="block py-2 text-lg font-semibold">
                    {item.label}
                  </Link>
                ) : (
                  <span className="block py-2 text-lg font-semibold">{item.label}</span>
                )}
                {item.children.length ? (
                  <ul className="mb-2 ml-3 border-l border-line pl-3">
                    {item.children.map((c) => (
                      <li key={c.url}>
                        <a
                          href={c.url}
                          {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                          className="block py-2 text-ink-soft hover:text-brand"
                        >
                          {c.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
