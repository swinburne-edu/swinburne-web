import type { CollectionConfig } from 'payload'

import { isAdmin, isAdmissions, nobody } from '@/access'

export const crmStatuses = ['pending', 'sent', 'failed'] as const
export type CrmStatus = (typeof crmStatuses)[number]

export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'Đăng ký tư vấn', plural: 'Đăng ký tư vấn (lead)' },
  access: {
    // Lead chỉ được tạo qua POST /api/leads (validate + Turnstile), không tạo trực tiếp qua REST
    create: nobody,
    read: isAdmissions,
    update: isAdmissions,
    delete: isAdmin,
  },
  admin: {
    useAsTitle: 'fullName',
    group: 'Tuyển sinh',
    defaultColumns: ['fullName', 'phone', 'programInterest', 'campus', 'crmStatus', 'createdAt'],
    listSearchableFields: ['fullName', 'phone', 'email'],
    description: 'Lead được lưu trước rồi mới đẩy sang CRM. Lead lỗi tự thử lại tối đa 5 lần.',
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'fullName', type: 'text', label: 'Họ tên', required: true },
        { name: 'phone', type: 'text', label: 'Điện thoại', required: true, index: true },
        { name: 'email', type: 'email', label: 'Email' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'programInterest', type: 'text', label: 'Chương trình quan tâm' },
        { name: 'campus', type: 'text', label: 'Cơ sở' },
        {
          name: 'locale',
          type: 'select',
          label: 'Ngôn ngữ',
          options: ['vi', 'en'],
          defaultValue: 'vi',
        },
      ],
    },
    { name: 'sourceUrl', type: 'text', label: 'Trang gửi form' },
    {
      name: 'utm',
      type: 'group',
      label: 'UTM',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'source', type: 'text' },
            { name: 'medium', type: 'text' },
            { name: 'campaign', type: 'text' },
            { name: 'term', type: 'text' },
            { name: 'content', type: 'text' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'gclid', type: 'text' },
        { name: 'fbclid', type: 'text' },
      ],
    },
    {
      name: 'idempotencyKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'crmStatus',
      type: 'select',
      label: 'Trạng thái CRM',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Đang chờ', value: 'pending' },
        { label: 'Đã gửi', value: 'sent' },
        { label: 'Lỗi', value: 'failed' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'crmAttempts',
      type: 'number',
      label: 'Số lần gửi CRM',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'crmLastAttemptAt',
      type: 'date',
      label: 'Lần gửi gần nhất',
      admin: { position: 'sidebar', readOnly: true },
    },
    { name: 'crmResponse', type: 'json', label: 'Phản hồi CRM', admin: { readOnly: true } },
  ],
  timestamps: true,
}
