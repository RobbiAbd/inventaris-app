import { z } from 'zod'

export const profileUpdateSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  passwordSaatIni: z.string().optional(),
  passwordBaru: z.string().min(6, 'Password baru minimal 6 karakter').optional().or(z.literal(''))
}).superRefine((data, ctx) => {
  if (data.passwordBaru && !data.passwordSaatIni) {
    ctx.addIssue({
      code: 'custom',
      message: 'Password saat ini wajib diisi untuk mengganti password',
      path: ['passwordSaatIni']
    })
  }
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>

export interface ProfileItem {
  id: number
  nama: string
  email: string
  role: 'HRD' | 'KARYAWAN'
}
