import Link from 'next/link'
import type { ComponentPropsWithoutRef } from 'react'

type Props = Omit<ComponentPropsWithoutRef<'a'>, 'href'> & { href: string }

const isExternal = (href: string) => /^(https?:)?\/\//i.test(href)
const isSpecial = (href: string) => /^(mailto:|tel:|#)/i.test(href)

/** Link nội bộ dùng next/link (prefetch), link ngoài mở tab mới an toàn. */
export function SmartLink({ href, children, ...rest }: Props) {
  if (isSpecial(href)) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    )
  }
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  )
}
