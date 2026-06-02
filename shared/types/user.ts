import { z } from 'zod'

export const ROLES = ['HRD', 'KARYAWAN'] as const
export type UserRole = (typeof ROLES)[number]

export const roleLabels: Record<UserRole, string> = {
  HRD: 'HRD',
  KARYAWAN: 'Karyawan'
}

export const createUserSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(ROLES)
})

export const updateUserSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter').optional().or(z.literal('')),
  role: z.enum(ROLES)
})

export type UserInput = z.infer<typeof createUserSchema>
export type UserUpdateInput = z.infer<typeof updateUserSchema>

export type UserFormData = {
  nama: string
  email: string
  role: UserRole
  password?: string
}

export interface UserItem {
  id: number
  nama: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
  _count?: {
    barang: number
  }
}
