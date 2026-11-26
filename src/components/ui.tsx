import clsx from 'clsx'
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

import { SmartLink } from './smart-link'

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('container-site', className)}>{children}</div>
}

type SectionProps = {
  id?: string
  className?: string
  tone?: 'white' | 'surface' | 'dark' | 'brand'
  children: ReactNode
  labelledBy?: string
}

export function Section({ id, className, tone = 'white', children, labelledBy }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={clsx(
        'py-12 md:py-(--spacing-section)',
        tone === 'surface' && 'bg-surface',
        tone === 'dark' && 'bg-dark text-white',
        tone === 'brand' && 'bg-brand text-white',
        className,
      )}
    >
      <Container>{children}</Container>
    </section>
  )
}

export function SectionHeading({
  id,
  title,
  intro,
  as: Tag = 'h2',
  className,
}: {
  id?: string
  title: string
  intro?: string | null
  as?: ElementType
  className?: string
}) {
  return (
    <div className={clsx('mb-8 max-w-3xl', className)}>
      <Tag id={id} className="text-2xl font-bold tracking-tight md:text-3xl">
        {title}
      </Tag>
      {intro ? <p className="mt-3 text-lg opacity-80">{intro}</p> : null}
    </div>
  )
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'light'
export type ButtonSize = 'md' | 'lg' | 'sm'

export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
) {
  return clsx(
    'inline-flex items-center justify-center gap-2 rounded-(--radius-btn) font-semibold transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-60',
    size === 'sm' && 'min-h-9 px-3 text-sm',
    size === 'md' && 'min-h-11 px-5 text-base',
    size === 'lg' && 'min-h-12 px-6 text-lg',
    variant === 'primary' && 'bg-brand text-white hover:bg-brand-dark',
    variant === 'secondary' && 'border-2 border-current text-brand hover:bg-brand-light',
    variant === 'ghost' && 'text-ink hover:bg-surface',
    variant === 'light' && 'bg-white text-brand-dark hover:bg-brand-light',
    className,
  )
}

type ButtonLinkProps = {
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children: ReactNode
} & Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'className' | 'children'>

export function ButtonLink({ href, variant, size, className, children, ...rest }: ButtonLinkProps) {
  return (
    <SmartLink href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </SmartLink>
  )
}

export function Button({
  variant,
  size,
  className,
  ...rest
}: ComponentPropsWithoutRef<'button'> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonClass(variant, size, className)} {...rest} />
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'brand' | 'warning' | 'success'
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tone === 'neutral' && 'bg-surface text-ink-soft',
        tone === 'brand' && 'bg-brand-light text-brand-dark',
        tone === 'warning' && 'bg-amber-100 text-warning',
        tone === 'success' && 'bg-green-100 text-success',
      )}
    >
      {children}
    </span>
  )
}
