import type { Block, Field } from 'payload'

const linkFields = (name: string, label: string): Field => ({
  name,
  type: 'group',
  label,
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'label', type: 'text', label: 'Chữ trên nút' },
        {
          name: 'url',
          type: 'text',
          label: 'Đường dẫn',
          admin: { description: 'Vd: /chuong-trinh/cu-nhan, #dang-ky, https://…' },
        },
      ],
    },
  ],
})

export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'Ảnh bìa (Hero)', plural: 'Ảnh bìa (Hero)' },
  fields: [
    { name: 'heading', type: 'text', label: 'Tiêu đề lớn', required: true },
    { name: 'subheading', type: 'textarea', label: 'Mô tả ngắn' },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Ảnh nền' },
    linkFields('primaryCta', 'Nút chính'),
    linkFields('secondaryCta', 'Nút phụ'),
    {
      name: 'isPageTitle',
      type: 'checkbox',
      label: 'Tiêu đề này là h1 của trang',
      defaultValue: true,
      admin: { description: 'Mỗi trang chỉ có đúng một h1.' },
    },
  ],
}

export const RichTextBlock: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  labels: { singular: 'Văn bản', plural: 'Văn bản' },
  fields: [{ name: 'content', type: 'richText', label: 'Nội dung', required: true }],
}

export const CardGridBlock: Block = {
  slug: 'cardGrid',
  interfaceName: 'CardGridBlock',
  labels: { singular: 'Lưới thẻ', plural: 'Lưới thẻ' },
  fields: [
    { name: 'heading', type: 'text', label: 'Tiêu đề' },
    { name: 'intro', type: 'textarea', label: 'Mô tả' },
    {
      name: 'source',
      type: 'select',
      label: 'Nguồn dữ liệu',
      defaultValue: 'manual',
      required: true,
      options: [
        { label: 'Tự nhập', value: 'manual' },
        { label: 'Chương trình', value: 'programs' },
        { label: 'Ngành học', value: 'majors' },
        { label: 'Tin mới (không lấy bài lưu trữ)', value: 'news' },
        { label: 'Sự kiện sắp tới', value: 'events' },
        { label: 'Cơ sở', value: 'campuses' },
      ],
    },
    {
      name: 'limit',
      type: 'number',
      label: 'Số thẻ tối đa',
      defaultValue: 6,
      min: 1,
      max: 24,
      admin: { condition: (_, s) => s?.source !== 'manual' },
    },
    {
      name: 'items',
      type: 'array',
      label: 'Các thẻ',
      admin: { condition: (_, s) => s?.source === 'manual' },
      fields: [
        { name: 'title', type: 'text', label: 'Tiêu đề', required: true },
        { name: 'text', type: 'textarea', label: 'Mô tả' },
        { name: 'image', type: 'upload', relationTo: 'media', label: 'Ảnh' },
        { name: 'url', type: 'text', label: 'Đường dẫn' },
      ],
    },
    {
      name: 'columns',
      type: 'select',
      label: 'Số cột (desktop)',
      defaultValue: '3',
      options: ['2', '3', '4'],
    },
    linkFields('moreLink', 'Link "Xem thêm"'),
  ],
}

export const CtaBlock: Block = {
  slug: 'cta',
  interfaceName: 'CtaBlock',
  labels: { singular: 'Kêu gọi hành động (CTA)', plural: 'CTA' },
  fields: [
    { name: 'heading', type: 'text', label: 'Tiêu đề', required: true },
    { name: 'text', type: 'textarea', label: 'Nội dung' },
    linkFields('primary', 'Nút chính'),
    linkFields('secondary', 'Nút phụ'),
    {
      name: 'tone',
      type: 'select',
      label: 'Màu nền',
      defaultValue: 'brand',
      options: [
        { label: 'Đỏ thương hiệu', value: 'brand' },
        { label: 'Tối', value: 'dark' },
        { label: 'Sáng', value: 'light' },
      ],
    },
  ],
}

export const FaqListBlock: Block = {
  slug: 'faqList',
  interfaceName: 'FaqListBlock',
  labels: { singular: 'Danh sách FAQ', plural: 'Danh sách FAQ' },
  fields: [
    { name: 'heading', type: 'text', label: 'Tiêu đề' },
    {
      name: 'faqs',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
      label: 'Chọn câu hỏi',
      admin: { description: 'Để trống để lấy theo nhóm bên dưới.' },
    },
    {
      name: 'group',
      type: 'select',
      label: 'Hoặc lấy theo nhóm',
      options: [
        { label: 'Tuyển sinh', value: 'admissions' },
        { label: 'Học phí & học bổng', value: 'tuition' },
        { label: 'Chương trình học', value: 'programs' },
        { label: 'Đời sống sinh viên', value: 'student-life' },
        { label: 'Khác', value: 'other' },
      ],
    },
  ],
}

export const LeadFormBlock: Block = {
  slug: 'leadForm',
  interfaceName: 'LeadFormBlock',
  labels: { singular: 'Form đăng ký tư vấn', plural: 'Form đăng ký tư vấn' },
  fields: [
    { name: 'heading', type: 'text', label: 'Tiêu đề' },
    { name: 'intro', type: 'textarea', label: 'Mô tả' },
    {
      name: 'anchor',
      type: 'text',
      label: 'Neo (anchor)',
      defaultValue: 'dang-ky',
      admin: { description: 'Cho phép link tới form bằng #dang-ky' },
    },
  ],
}

export const VideoBlock: Block = {
  slug: 'video',
  interfaceName: 'VideoBlock',
  labels: { singular: 'Video', plural: 'Video' },
  fields: [
    { name: 'title', type: 'text', label: 'Tiêu đề video', required: true },
    {
      name: 'youtubeUrl',
      type: 'text',
      label: 'Link YouTube',
      required: true,
      validate: (v: unknown) =>
        typeof v === 'string' && /(youtube\.com|youtu\.be)\//.test(v)
          ? true
          : 'Cần link YouTube hợp lệ',
    },
    { name: 'poster', type: 'upload', relationTo: 'media', label: 'Ảnh xem trước (tuỳ chọn)' },
  ],
}

export const TableBlock: Block = {
  slug: 'table',
  interfaceName: 'TableBlock',
  labels: { singular: 'Bảng', plural: 'Bảng' },
  fields: [
    { name: 'caption', type: 'text', label: 'Tiêu đề bảng', required: true },
    {
      name: 'columns',
      type: 'array',
      label: 'Cột',
      minRows: 1,
      fields: [{ name: 'label', type: 'text', label: 'Tên cột', required: true }],
    },
    {
      name: 'rows',
      type: 'array',
      label: 'Hàng',
      fields: [
        {
          name: 'cells',
          type: 'array',
          label: 'Ô',
          fields: [{ name: 'value', type: 'text', label: 'Giá trị' }],
        },
      ],
    },
  ],
}

export const StatsBlock: Block = {
  slug: 'stats',
  interfaceName: 'StatsBlock',
  labels: { singular: 'Số liệu nổi bật', plural: 'Số liệu nổi bật' },
  fields: [
    { name: 'heading', type: 'text', label: 'Tiêu đề' },
    {
      name: 'items',
      type: 'array',
      label: 'Số liệu',
      minRows: 1,
      maxRows: 6,
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'value', type: 'text', label: 'Con số', required: true },
            { name: 'label', type: 'text', label: 'Mô tả', required: true },
          ],
        },
      ],
    },
  ],
}

export const TestimonialsBlock: Block = {
  slug: 'testimonials',
  interfaceName: 'TestimonialsBlock',
  labels: { singular: 'Cảm nhận sinh viên', plural: 'Cảm nhận sinh viên' },
  fields: [
    { name: 'heading', type: 'text', label: 'Tiêu đề' },
    {
      name: 'testimonials',
      type: 'relationship',
      relationTo: 'testimonials',
      hasMany: true,
      label: 'Chọn cảm nhận',
      admin: { description: 'Để trống để lấy 3 cảm nhận mới nhất.' },
    },
  ],
}

export const pageBlocks: Block[] = [
  HeroBlock,
  RichTextBlock,
  CardGridBlock,
  CtaBlock,
  FaqListBlock,
  LeadFormBlock,
  VideoBlock,
  TableBlock,
  StatsBlock,
  TestimonialsBlock,
]
