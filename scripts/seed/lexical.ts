/** Dựng nhanh nội dung Lexical (rich text) cho dữ liệu mẫu. */

type TextNode = {
  type: 'text'
  text: string
  format: number
  detail: number
  mode: 'normal'
  style: string
  version: 1
}

type ElementNode = {
  type: string
  children: unknown[]
  direction: 'ltr'
  format: ''
  indent: 0
  version: 1
  [k: string]: unknown
}

const text = (t: string, bold = false): TextNode => ({
  type: 'text',
  text: t,
  format: bold ? 1 : 0,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})

const element = (
  type: string,
  children: unknown[],
  extra: Record<string, unknown> = {},
): ElementNode => ({
  type,
  children,
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
  ...extra,
})

export type Block = string | { h2: string } | { h3: string } | { ul: string[] } | { bold: string }

export function lexical(blocks: Block[]) {
  const children = blocks.map((b) => {
    if (typeof b === 'string')
      return element('paragraph', [text(b)], { textFormat: 0, textStyle: '' })
    if ('h2' in b) return element('heading', [text(b.h2)], { tag: 'h2' })
    if ('h3' in b) return element('heading', [text(b.h3)], { tag: 'h3' })
    if ('bold' in b)
      return element('paragraph', [text(b.bold, true)], { textFormat: 1, textStyle: '' })
    return element(
      'list',
      b.ul.map((item, i) => element('listitem', [text(item)], { value: i + 1 })),
      { listType: 'bullet', start: 1, tag: 'ul' },
    )
  })
  return { root: element('root', children) }
}
