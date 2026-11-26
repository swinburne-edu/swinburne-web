import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'

export const roles = ['admin', 'editor', 'admissions'] as const
export type Role = (typeof roles)[number]

type UserLike = { roles?: (Role | string)[] | null } | null | undefined

export function hasRole(user: UserLike, ...wanted: Role[]): boolean {
  const userRoles = user?.roles ?? []
  return wanted.some((r) => userRoles.includes(r))
}

const userOf = (req: PayloadRequest): UserLike => req.user as UserLike

export const anyone: Access = () => true
export const nobody: Access = () => false

export const isAdmin: Access = ({ req }) => hasRole(userOf(req), 'admin')

/** Biên tập nội dung: admin + editor */
export const isEditor: Access = ({ req }) => hasRole(userOf(req), 'admin', 'editor')

/** Lead / tuyển sinh: admin + admissions */
export const isAdmissions: Access = ({ req }) => hasRole(userOf(req), 'admin', 'admissions')

export const isLoggedIn: Access = ({ req }) => Boolean(req.user)

const publishedOnly: Where = { _status: { equals: 'published' } }

/** Khách chỉ đọc bản đã xuất bản; người dùng đã đăng nhập đọc cả bản nháp. */
export const publishedOrStaff: Access = ({ req }) => (req.user ? true : publishedOnly)

export const adminFieldOnly: FieldAccess = ({ req }) => hasRole(userOf(req), 'admin')

/** Bộ quyền chuẩn cho nội dung biên tập (có bản nháp) */
export const editorialAccess = {
  create: isEditor,
  read: publishedOrStaff,
  update: isEditor,
  delete: isEditor,
  readVersions: isEditor,
}

/** Bộ quyền cho dữ liệu không có bản nháp (danh mục, thẻ, media) */
export const publicReadEditorWrite = {
  create: isEditor,
  read: anyone,
  update: isEditor,
  delete: isEditor,
}
