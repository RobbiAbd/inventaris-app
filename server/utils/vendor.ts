import type { VendorInput } from '../../shared/types/vendor'
import { notDeleted } from './softDelete'
import { prisma } from './db'

export function parseVendorInput(data: VendorInput) {
  return {
    nama: data.nama,
    jenis: data.jenis,
    kontak: data.kontak || null,
    telepon: data.telepon || null,
    email: data.email || null,
    alamat: data.alamat || null
  }
}

export function serializeVendor(vendor: {
  id: number
  nama: string
  jenis: string
  kontak: string | null
  telepon: string | null
  email: string | null
  alamat: string | null
  createdAt: Date
  updatedAt: Date
  _count?: { barang: number }
}) {
  return {
    id: vendor.id,
    nama: vendor.nama,
    jenis: vendor.jenis,
    kontak: vendor.kontak,
    telepon: vendor.telepon,
    email: vendor.email,
    alamat: vendor.alamat,
    createdAt: vendor.createdAt.toISOString(),
    updatedAt: vendor.updatedAt.toISOString(),
    _count: vendor._count
  }
}

export async function validateVendorExists(vendorId?: number) {
  if (!vendorId) return

  const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, ...notDeleted } })

  if (!vendor) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Vendor tidak ditemukan'
    })
  }
}
