import { z } from 'zod'

export interface PerbaikanItem {
  id: number
  barangId: number
  tanggal: string
  deskripsi: string
  biaya: string | null
  lokasiServis: string | null
  statusSebelum: string | null
  statusSesudah: string | null
  catatan: string | null
  createdById: number | null
  createdAt: string
  updatedAt: string
  createdBy?: {
    id: number
    nama: string
  } | null
}

export const perbaikanInputSchema = z.object({
  tanggal: z.string().min(1, 'Tanggal perbaikan wajib diisi'),
  deskripsi: z.string().min(3, 'Deskripsi wajib diisi'),
  biaya: z.coerce.number().nonnegative().optional(),
  lokasiServis: z.string().optional(),
  statusSesudah: z.string().optional(),
  catatan: z.string().optional()
})

export type PerbaikanInput = z.infer<typeof perbaikanInputSchema>
