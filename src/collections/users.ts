import type { CollectionConfig } from 'payload'

import { adminFieldOnly, hasRole, isAdmin, roles } from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Người dùng', plural: 'Người dùng' },
  auth: {
    tokenExpiration: 60 * 60 * 8,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'roles'],
    group: 'Hệ thống',
  },
  access: {
    // Người dùng đầu tiên được tạo qua màn hình "Tạo admin đầu tiên"
    create: isAdmin,
    read: ({ req }) => {
      if (hasRole(req.user as never, 'admin')) return true
      return req.user ? { id: { equals: req.user.id } } : false
    },
    update: ({ req }) => {
      if (hasRole(req.user as never, 'admin')) return true
      return req.user ? { id: { equals: req.user.id } } : false
    },
    delete: isAdmin,
    admin: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'name', type: 'text', label: 'Họ tên' },
    {
      name: 'roles',
      type: 'select',
      label: 'Vai trò',
      hasMany: true,
      required: true,
      defaultValue: ['editor'],
      saveToJWT: true,
      options: [
        { label: 'Quản trị (admin)', value: roles[0] },
        { label: 'Biên tập viên (editor)', value: roles[1] },
        { label: 'Tuyển sinh (admissions)', value: roles[2] },
      ],
      access: {
        // !req.user: màn hình tạo admin đầu tiên (collection create vẫn chỉ cho admin)
        create: (args) => !args.req.user || adminFieldOnly(args),
        update: adminFieldOnly,
      },
      admin: {
        description:
          'admin: toàn quyền · editor: sửa nội dung · admissions: xem/xử lý đăng ký tư vấn (lead)',
      },
    },
  ],
  hooks: {
    beforeChange: [
      // Người dùng đầu tiên của hệ thống luôn là admin
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const { totalDocs } = await req.payload.count({ collection: 'users', req })
        if (totalDocs === 0) return { ...data, roles: ['admin'] }
        return data
      },
    ],
  },
  timestamps: true,
}
