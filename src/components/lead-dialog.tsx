'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionary'

import type { LeadFormOptionsProp } from './lead-form'

// JS của form chỉ tải khi người dùng mở dialog
const LeadForm = dynamic(() => import('./lead-form').then((m) => m.LeadForm), { ssr: false })

type Props = {
  locale: Locale
  options: LeadFormOptionsProp
  turnstileSiteKey: string
}

/**
 * Bắt mọi click vào link có data-lead-dialog (nút "Đăng ký tư vấn") → mở <dialog> chứa form.
 * Không có JS: link vẫn dẫn tới trang đăng ký (href gốc).
 */
export function LeadDialog({ locale, options, turnstileSiteKey }: Props) {
  const t = getDictionary(locale)
  const ref = useRef<HTMLDialogElement>(null)
  const [opened, setOpened] = useState(false)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return
      const target = (e.target as HTMLElement | null)?.closest('a[data-lead-dialog]')
      if (!target || !ref.current) return
      // Capture phase: chặn trước khi next/link điều hướng sang trang đăng ký
      e.preventDefault()
      e.stopPropagation()
      setOpened(true)
      if (!ref.current.open) ref.current.showModal()
    }
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby="lead-dialog-title"
      className="m-auto w-[min(40rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-(--radius-card) p-0 shadow-2xl backdrop:bg-black/60"
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close()
      }}
    >
      <div className="relative p-6 md:p-8">
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="absolute top-3 right-3 inline-flex h-11 w-11 items-center justify-center rounded-full text-2xl text-ink-soft hover:bg-surface"
          aria-label={t.close}
        >
          ×
        </button>
        {opened ? (
          <LeadForm
            locale={locale}
            options={options}
            turnstileSiteKey={turnstileSiteKey}
            headingId="lead-dialog-title"
          />
        ) : (
          <h2 id="lead-dialog-title" className="text-xl font-bold">
            {t.formTitle}
          </h2>
        )}
      </div>
    </dialog>
  )
}
