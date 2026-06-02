import type { BarangInput } from '../../shared/types/barang'
import type { Prisma } from '@prisma/client'
import { prisma } from './db'
import { notDeleted } from './softDelete'
import { validateVendorExists } from './vendor'
import { serializeBarangEvidence } from './barangEvidence'

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
    harga: data.harga != null ? data.harga : null,
    keterangan: data.keterangan?.trim() || null,
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
  harga: { toString(): string } | null
  keterangan: string | null
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
  evidence?: Array<{
    id: number
    filePath: string
    originalName: string
    mimeType: string
    fileSize: number
    sortOrder: number
    createdAt: Date
  }>
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
    harga: barang.harga?.toString() ?? null,
    keterangan: barang.keterangan,
    userId: barang.userId,
    vendorId: barang.vendorId,
    user: barang.user ?? null,
    vendor: barang.vendor ?? null,
    evidence: (barang.evidence ?? []).map(serializeBarangEvidence),
    createdAt: barang.createdAt.toISOString(),
    updatedAt: barang.updatedAt.toISOString()
  }
}

export const barangListInclude = {
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
} satisfies Prisma.BarangInclude

export const barangInclude = {
  ...barangListInclude,
  evidence: {
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
  }
} satisfies Prisma.BarangInclude

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
