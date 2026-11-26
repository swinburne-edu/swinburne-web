type LexicalNode = { type?: string; text?: string; children?: LexicalNode[] }

const BLOCK_TYPES = new Set(['paragraph', 'heading', 'listitem', 'quote', 'list'])

/** Lấy văn bản thuần từ Lexical JSON (dùng cho JSON-LD, mô tả meta). */
export function lexicalToPlainText(value: unknown, maxLength?: number): string {
  const root = (value as { root?: LexicalNode } | null)?.root
  if (!root) return ''
  const parts: string[] = []
  const walk = (node: LexicalNode) => {
    if (typeof node.text === 'string') parts.push(node.text)
    if (node.type === 'linebreak') parts.push('\n')
    node.children?.forEach(walk)
    if (node.type && BLOCK_TYPES.has(node.type)) parts.push('\n')
  }
  walk(root)
  const text = parts
    .join('')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
  if (!maxLength || text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).replace(/\s+\S*$/, '')}…`
}
