import { z } from 'zod'
import type { MasterOptionItem } from './master'

export function buildVendorSchema(jenisOptions: MasterOptionItem[]) {
  const jenisKodes = jenisOptions.filter(o => o.isActive).map(o => o.kode)

  if (!jenisKodes.length) {
    throw new Error('Master data jenis vendor belum diisi.')
  }

  return z.object({
    nama: z.string().min(1, 'Nama vendor wajib diisi'),
    jenis: z.enum(jenisKodes as [string, ...string[]]),
    kontak: z.string().optional(),
    telepon: z.string().optional(),
    email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
    alamat: z.string().optional()
  })
}

export type VendorInput = {
  nama: string
  jenis: string
  kontak?: string
  telepon?: string
  email?: string
  alamat?: string
}

export interface VendorItem {
  id: number
  nama: string
  jenis: string
  kontak: string | null
  telepon: string | null
  email: string | null
  alamat: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    barang: number
  }
}

export function getJenisVendorKodeForKategori(
  kategoriOptions: MasterOptionItem[],
  kategoriKode: string
) {
  const option = kategoriOptions.find(o => o.kode === kategoriKode)
  const config = option?.config as { jenisVendorKode?: string } | null
  return config?.jenisVendorKode ?? null
}
