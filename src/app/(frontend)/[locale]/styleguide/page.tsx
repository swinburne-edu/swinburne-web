import type { Metadata } from 'next'

import { Breadcrumb } from '@/components/breadcrumb'
import { Card, CardGrid } from '@/components/card'
import { Pagination } from '@/components/pagination'
import { Badge, Button, ButtonLink, Container, Section, SectionHeading } from '@/components/ui'
import { assertLocale, type LocaleParams } from '@/lib/page-helpers'

/** Trang nội bộ xem nhanh component — không index. */
export const metadata: Metadata = {
  title: 'Styleguide',
  robots: { index: false, follow: false },
}

const colors = [
  ['brand', 'bg-brand'],
  ['brand-dark', 'bg-brand-dark'],
  ['brand-light', 'bg-brand-light'],
  ['ink', 'bg-ink'],
  ['muted', 'bg-muted'],
  ['surface', 'bg-surface'],
  ['line', 'bg-line'],
  ['dark', 'bg-dark'],
] as const

export default async function StyleguidePage({ params }: { params: LocaleParams }) {
  const locale = assertLocale((await params).locale)
  return (
    <>
      <Container className="py-10">
        <Breadcrumb locale={locale} items={[{ label: 'Styleguide' }]} />
        <h1 className="mt-4 text-4xl font-bold">Styleguide</h1>
        <p className="mt-2 text-muted">
          Design tokens & component dùng chung (trang nội bộ, noindex).
        </p>
      </Container>

      <Section labelledBy="sg-colors">
        <SectionHeading id="sg-colors" title="Màu" />
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {colors.map(([name, cls]) => (
            <li key={name} className="overflow-hidden rounded-(--radius-card) border border-line">
              <div className={`h-20 ${cls}`} />
              <p className="p-3 font-mono text-sm">{name}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="surface" labelledBy="sg-type">
        <SectionHeading
          id="sg-type"
          title="Chữ"
          intro="Be Vietnam Pro — 400 / 600 / 700, subset tiếng Việt."
        />
        <p className="text-4xl font-bold">Tiêu đề lớn — Đăng ký tư vấn</p>
        <p className="mt-3 text-2xl font-semibold">Tiêu đề phụ — Chương trình Cử nhân</p>
        <p className="mt-3 max-w-2xl text-lg">
          Đoạn văn mẫu: Swinburne Việt Nam mang đến chương trình đào tạo chuẩn Úc ngay tại Việt Nam.
          Ạ ặ ẩ ẫ ậ ơ ư đ.
        </p>
      </Section>

      <Section labelledBy="sg-buttons">
        <SectionHeading id="sg-buttons" title="Nút" />
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button size="lg">Large</Button>
          <Button size="sm">Small</Button>
          <Button disabled>Disabled</Button>
          <ButtonLink href="#">Link dạng nút</ButtonLink>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="brand">Brand</Badge>
          <Badge tone="warning">Đã hết hiệu lực</Badge>
          <Badge tone="success">Đang mở đăng ký</Badge>
        </div>
      </Section>

      <Section tone="surface" labelledBy="sg-cards">
        <SectionHeading id="sg-cards" title="Thẻ" />
        <CardGrid>
          <Card
            title="Thẻ có link, không ảnh"
            href="#"
            text="Mô tả ngắn của thẻ."
            meta="01/01/2026"
          />
          <Card
            title="Tiêu đề rất dài để kiểm tra việc cắt dòng khi nội dung vượt quá ba dòng trong thẻ — Swinburne Việt Nam chương trình liên kết quốc tế"
            text="Ca khó: tiêu đề dài."
            badge={<Badge tone="brand">Cử nhân</Badge>}
          />
          <Card title="Thẻ không link" text="Không có ảnh, không có link." />
        </CardGrid>
      </Section>

      <Section labelledBy="sg-pagination">
        <SectionHeading id="sg-pagination" title="Phân trang" />
        <Pagination locale={locale} page={5} totalPages={20} hrefFor={(p) => `?page=${p}`} />
      </Section>
    </>
  )
}
