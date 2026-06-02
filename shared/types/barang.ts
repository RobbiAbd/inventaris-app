import { z } from 'zod'
import type { MasterOptionItem } from './master'
import { getKategoriConfig } from './master'

export interface BarangInput {
  nama: string
  kategori: string
  merk?: string
  nomorSeri?: string
  status: string
  tipePerolehan: string
  tanggalPembelian?: string
  tanggalMulaiSewa?: string
  tanggalAkhirSewa?: string
  lokasi?: string
  userId?: number
  vendorId?: number
}

export interface BarangItem {
  id: number
  nama: string
  kategori: string
  merk: string | null
  nomorSeri: string | null
  status: string
  tipePerolehan: string
  tanggalPembelian: string | null
  tanggalMulaiSewa: string | null
  tanggalAkhirSewa: string | null
  lokasi: string | null
  userId: number | null
  vendorId: number | null
  user: {
    id: number
    nama: string
    email: string
  } | null
  vendor: {
    id: number
    nama: string
    jenis: string
    telepon: string | null
  } | null
  createdAt: string
  updatedAt: string
}

export function buildBarangSchema(
  kategoriOptions: MasterOptionItem[],
  statusOptions: MasterOptionItem[],
  tipeOptions: MasterOptionItem[]
) {
  const kategoriKodes = kategoriOptions.filter(o => o.isActive).map(o => o.kode)
  const statusKodes = statusOptions.filter(o => o.isActive).map(o => o.kode)
  const tipeKodes = tipeOptions.filter(o => o.isActive).map(o => o.kode)

  if (!kategoriKodes.length || !statusKodes.length || !tipeKodes.length) {
    throw new Error('Master data belum lengkap. Hubungi HRD untuk mengisi pengaturan.')
  }

  const kategoriMap = new Map(kategoriOptions.map(o => [o.kode, o]))

  return z.object({
    nama: z.string().min(1, 'Nama barang wajib diisi'),
    kategori: z.enum(kategoriKodes as [string, ...string[]]),
    merk: z.string().optional(),
    nomorSeri: z.string().optional(),
    status: z.enum(statusKodes as [string, ...string[]]),
    tipePerolehan: z.enum(tipeKodes as [string, ...string[]]),
    tanggalPembelian: z.string().optional(),
    tanggalMulaiSewa: z.string().optional(),
    tanggalAkhirSewa: z.string().optional(),
    lokasi: z.string().optional(),
    userId: z.coerce.number().int().positive().optional(),
    vendorId: z.coerce.number().int().positive().optional()
  }).superRefine((data, ctx) => {
    const kategori = kategoriMap.get(data.kategori)
    const config = getKategoriConfig(kategori)

    if (config.wajibSewa && data.tipePerolehan !== 'SEWA') {
      ctx.addIssue({
        code: 'custom',
        message: `Kategori ${kategori?.label ?? data.kategori} harus dicatat sebagai sewa vendor`,
        path: ['tipePerolehan']
      })
    }

    if (config.wajibAssignUser && !data.userId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Kategori ini wajib ditugaskan ke karyawan',
        path: ['userId']
      })
    }

    if (data.tipePerolehan === 'SEWA') {
      if (!data.vendorId) {
        ctx.addIssue({
          code: 'custom',
          message: 'Vendor wajib dipilih untuk barang sewa',
          path: ['vendorId']
        })
      }
      if (!data.tanggalMulaiSewa) {
        ctx.addIssue({
          code: 'custom',
          message: 'Tanggal mulai sewa wajib diisi',
          path: ['tanggalMulaiSewa']
        })
      }
    }
  })
}
