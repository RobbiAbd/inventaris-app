import { z } from 'zod'

export const PENGAJUAN_JENIS = {
  UBAH_STATUS: 'UBAH_STATUS',
  GANTI_BARANG: 'GANTI_BARANG',
  AJUKAN_PERBAIKAN: 'AJUKAN_PERBAIKAN'
} as const

export type PengajuanJenis = typeof PENGAJUAN_JENIS[keyof typeof PENGAJUAN_JENIS]

export const PENGAJUAN_STATUS = {
  MENUNGGU: 'MENUNGGU',
  DISETUJUI: 'DISETUJUI',
  DITOLAK: 'DITOLAK'
} as const

export type PengajuanStatus = typeof PENGAJUAN_STATUS[keyof typeof PENGAJUAN_STATUS]

export const PENGAJUAN_JENIS_LABELS: Record<PengajuanJenis, string> = {
  UBAH_STATUS: 'Ubah Status Barang',
  GANTI_BARANG: 'Ajukan Ganti Barang',
  AJUKAN_PERBAIKAN: 'Ajukan Catat Perbaikan'
}

export const PENGAJUAN_STATUS_LABELS: Record<PengajuanStatus, string> = {
  MENUNGGU: 'Menunggu',
  DISETUJUI: 'Disetujui',
  DITOLAK: 'Ditolak'
}

export interface PengajuanPayload {
  statusBaru?: string
  deskripsiPerbaikan?: string
  tanggalPerbaikan?: string
  lokasiServis?: string
  biayaPerbaikan?: number
}

export interface PengajuanItem {
  id: number
  barangId: number
  userId: number
  jenis: PengajuanJenis
  status: PengajuanStatus
  alasan: string
  payload: PengajuanPayload | null
  catatanReviewer: string | null
  reviewedById: number | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  barang?: {
    id: number
    nama: string
    status: string
    kategori: string
  }
  user?: {
    id: number
    nama: string
    email: string
  }
  reviewedBy?: {
    id: number
    nama: string
  } | null
}

export const createPengajuanSchema = z.object({
  barangId: z.coerce.number().int().positive(),
  jenis: z.enum([
    PENGAJUAN_JENIS.UBAH_STATUS,
    PENGAJUAN_JENIS.GANTI_BARANG,
    PENGAJUAN_JENIS.AJUKAN_PERBAIKAN
  ]),
  alasan: z.string().min(10, 'Alasan minimal 10 karakter'),
  payload: z.object({
    statusBaru: z.string().optional(),
    deskripsiPerbaikan: z.string().optional(),
    tanggalPerbaikan: z.string().optional(),
    lokasiServis: z.string().optional(),
    biayaPerbaikan: z.coerce.number().nonnegative().optional()
  }).optional()
}).superRefine((data, ctx) => {
  if (data.jenis === PENGAJUAN_JENIS.UBAH_STATUS && !data.payload?.statusBaru) {
    ctx.addIssue({
      code: 'custom',
      message: 'Status baru wajib dipilih',
      path: ['payload', 'statusBaru']
    })
  }
  if (data.jenis === PENGAJUAN_JENIS.AJUKAN_PERBAIKAN && !data.payload?.deskripsiPerbaikan) {
    ctx.addIssue({
      code: 'custom',
      message: 'Deskripsi perbaikan wajib diisi',
      path: ['payload', 'deskripsiPerbaikan']
    })
  }
})

export const reviewPengajuanSchema = z.object({
  action: z.enum(['approve', 'reject']),
  catatanReviewer: z.string().optional()
})

export type CreatePengajuanInput = z.infer<typeof createPengajuanSchema>
export type ReviewPengajuanInput = z.infer<typeof reviewPengajuanSchema>
