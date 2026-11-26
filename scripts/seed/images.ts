import sharp from 'sharp'

const PALETTE = [
  '#d42027',
  '#a8161c',
  '#1b1b1b',
  '#3d3d3d',
  '#7a1d22',
  '#b4462f',
  '#2f3b4a',
  '#5a2a5c',
]

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Chia chữ thành nhiều dòng cho ảnh mẫu */
function wrap(label: string, max = 26): string[] {
  const words = label.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) {
      if (line) lines.push(line)
      line = w
    } else {
      line = (line + ' ' + w).trim()
    }
  }
  if (line) lines.push(line)
  return lines.slice(0, 4)
}

/** Ảnh mẫu: khối màu + chữ, JPEG (đi qua collection media → tự chuyển WebP). */
export async function makeSampleImage(label: string, index: number, width = 1600, height = 1000) {
  const bg = PALETTE[index % PALETTE.length]!
  const lines = wrap(label)
  const fontSize = Math.round(width / 22)
  const startY = height / 2 - ((lines.length - 1) * fontSize * 1.25) / 2
  const tspans = lines
    .map((l, i) => `<tspan x="50%" y="${startY + i * fontSize * 1.25}">${escapeXml(l)}</tspan>`)
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#111"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="middle">${tspans}</text>
    <text x="50%" y="${height - 50}" font-family="Arial" font-size="${Math.round(fontSize / 2.2)}" fill="#ffffffaa" text-anchor="middle">ẢNH MẪU · SAMPLE</text>
  </svg>`
  const data = await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer()
  return { data, mimetype: 'image/jpeg', size: data.length }
}
