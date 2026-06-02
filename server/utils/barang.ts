import type { BarangInput } from '../../shared/types/barang'
import { prisma } from './db'
import { notDeleted } from './softDelete'
import { validateVendorExists } from './vendor'

export function parseBarangInput(data: BarangInput) {
  const isSewa = data.tipePerolehan === 'SEWA'

  return {
    nama: data.nama,
    kategori: data.kategori,
    merk: data.merk || null,
    nomorSeri: data.nomorSeri || null,
    status: data.status,
    tipePerolehan: data.tipePerolehan,
    tanggalPembelian: !isSewa && data.tanggalPembelian
      ? new Date(data.tanggalPembelian)
      : null,
    tanggalMulaiSewa: isSewa && data.tanggalMulaiSewa
      ? new Date(data.tanggalMulaiSewa)
      : null,
    tanggalAkhirSewa: isSewa && data.tanggalAkhirSewa
      ? new Date(data.tanggalAkhirSewa)
      : null,
    lokasi: data.lokasi || null,
    userId: data.userId ?? null,
    vendorId: isSewa ? (data.vendorId ?? null) : null
  }
}

export function serializeBarang(barang: {
  id: number
  nama: string
  kategori: string
  merk: string | null
  nomorSeri: string | null
  status: string
  tipePerolehan: string
  tanggalPembelian: Date | null
  tanggalMulaiSewa: Date | null
  tanggalAkhirSewa: Date | null
  lokasi: string | null
  userId: number | null
  vendorId: number | null
  createdAt: Date
  updatedAt: Date
  user?: {
    id: number
    nama: string
    email: string
  } | null
  vendor?: {
    id: number
    nama: string
    jenis: string
    telepon: string | null
  } | null
}) {
  return {
    id: barang.id,
    nama: barang.nama,
    kategori: barang.kategori,
    merk: barang.merk,
    nomorSeri: barang.nomorSeri,
    status: barang.status,
    tipePerolehan: barang.tipePerolehan,
    tanggalPembelian: barang.tanggalPembelian?.toISOString() ?? null,
    tanggalMulaiSewa: barang.tanggalMulaiSewa?.toISOString() ?? null,
    tanggalAkhirSewa: barang.tanggalAkhirSewa?.toISOString() ?? null,
    lokasi: barang.lokasi,
    userId: barang.userId,
    vendorId: barang.vendorId,
    user: barang.user ?? null,
    vendor: barang.vendor ?? null,
    createdAt: barang.createdAt.toISOString(),
    updatedAt: barang.updatedAt.toISOString()
  }
}

export const barangInclude = {
  user: {
    select: {
      id: true,
      nama: true,
      email: true
    }
  },
  vendor: {
    select: {
      id: true,
      nama: true,
      jenis: true,
      telepon: true
    }
  }
} as const

export async function validateUserAssignment(userId?: number) {
  if (!userId) return

  const user = await prisma.user.findFirst({ where: { id: userId, ...notDeleted } })

  if (!user) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Karyawan yang dipilih tidak ditemukan'
    })
  }
}

export async function validateBarangRelations(data: BarangInput) {
  await validateUserAssignment(data.userId)

  if (data.tipePerolehan === 'SEWA') {
    await validateVendorExists(data.vendorId)
  }
}
