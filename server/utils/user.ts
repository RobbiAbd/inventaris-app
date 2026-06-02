import type { UserUpdateInput, UserInput } from '../../shared/types/user'

export function serializeUser(user: {
  id: number
  nama: string
  email: string
  role: string
  createdAt: Date
  updatedAt: Date
  _count?: { barang: number }
}) {
  return {
    id: user.id,
    nama: user.nama,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    ...user._count && { _count: user._count }
  }
}

export function parseUserCreateInput(data: UserInput) {
  return {
    nama: data.nama.trim(),
    email: data.email.trim().toLowerCase(),
    password: data.password,
    role: data.role
  }
}

export function parseUserUpdateInput(data: UserUpdateInput) {
  return {
    nama: data.nama.trim(),
    email: data.email.trim().toLowerCase(),
    role: data.role,
    ...(data.password && data.password.length > 0 ? { password: data.password } : {})
  }
}
