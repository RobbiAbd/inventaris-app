import type { Prisma } from '@prisma/client'
import type { CreatePengajuanInput, PengajuanPayload } from '../../shared/types/pengajuan'
import { PENGAJUAN_JENIS, PENGAJUAN_STATUS } from '../../shared/types/pengajuan'
import { prisma } from './db'
import { logBarangUpdate } from './history'
import { createBarangPerbaikan } from './perbaikan'
import { notDeleted } from './softDelete'

export function serializePengajuan(record: {
  id: number
  barangId: number
  userId: number
  jenis: string
  status: string
  alasan: string
  payload: unknown
  catatanReviewer: string | null
  reviewedById: number | null
  reviewedAt: Date | null
  createdAt: Date
  updatedAt: Date
  barang?: { id: number, nama: string, status: string, kategori: string }
  user?: { id: number, nama: string, email: string }
  reviewedBy?: { id: number, nama: string } | null
}) {
  return {
    id: record.id,
    barangId: record.barangId,
    userId: record.userId,
    jenis: record.jenis,
    status: record.status,
    alasan: record.alasan,
    payload: (record.payload as PengajuanPayload | null) ?? null,
    catatanReviewer: record.catatanReviewer,
    reviewedById: record.reviewedById,
    reviewedAt: record.reviewedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    barang: record.barang,
    user: record.user,
    reviewedBy: record.reviewedBy ?? null
  }
}

export const pengajuanInclude = {
  barang: {
    select: { id: true, nama: true, status: true, kategori: true }
  },
  user: {
    select: { id: true, nama: true, email: true }
  },
  reviewedBy: {
    select: { id: true, nama: true }
  }
} satisfies Prisma.BarangPengajuanInclude

export async function createPengajuan(userId: number, data: CreatePengajuanInput) {
  const pending = await prisma.barangPengajuan.findFirst({
    where: {
      barangId: data.barangId,
      userId,
      status: PENGAJUAN_STATUS.MENUNGGU
    }
  })

  if (pending) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Masih ada pengajuan menunggu untuk barang ini'
    })
  }

  const record = await prisma.barangPengajuan.create({
    data: {
      barangId: data.barangId,
      userId,
      jenis: data.jenis,
      alasan: data.alasan.trim(),
      payload: data.payload ?? undefined
    },
    include: pengajuanInclude
  })

  return serializePengajuan(record)
}

export async function applyPengajuanApproval(
  pengajuan: {
    id: number
    jenis: string
    alasan: string
    payload: unknown
    barangId: number
  },
  reviewer: { id: number, nama: string }
) {
  const barang = await prisma.barang.findFirst({
    where: { id: pengajuan.barangId, ...notDeleted }
  })

  if (!barang) {
    throw createError({ statusCode: 404, statusMessage: 'Barang tidak ditemukan' })
  }

  const payload = (pengajuan.payload ?? {}) as PengajuanPayload
  const actor = { id: reviewer.id, nama: reviewer.nama }

  if (pengajuan.jenis === PENGAJUAN_JENIS.UBAH_STATUS) {
    if (!payload.statusBaru) {
      throw createError({ statusCode: 400, statusMessage: 'Payload status baru tidak valid' })
    }

    const updated = await prisma.barang.update({
      where: { id: barang.id },
      data: { status: payload.statusBaru }
    })

    await logBarangUpdate(actor, barang, { ...barang, status: updated.status })
    return
  }

  if (pengajuan.jenis === PENGAJUAN_JENIS.GANTI_BARANG) {
    const stamp = new Date().toLocaleDateString('id-ID')
    const note = `[Penggantian ${stamp}] ${pengajuan.alasan}`
    const keterangan = barang.keterangan ? `${barang.keterangan}\n\n${note}` : note

    const updated = await prisma.barang.update({
      where: { id: barang.id },
      data: {
        status: 'DIGANTI',
        keterangan
      }
    })

    await logBarangUpdate(actor, barang, updated)
    return
  }

  if (pengajuan.jenis === PENGAJUAN_JENIS.AJUKAN_PERBAIKAN) {
    await createBarangPerbaikan(
      barang.id,
      {
        tanggal: payload.tanggalPerbaikan ?? new Date().toISOString().slice(0, 10),
        deskripsi: payload.deskripsiPerbaikan ?? pengajuan.alasan,
        biaya: payload.biayaPerbaikan,
        lokasiServis: payload.lokasiServis,
        statusSesudah: 'DALAM_PERBAIKAN'
      },
      actor,
      barang.status
    )

    if (barang.status !== 'DALAM_PERBAIKAN') {
      const updated = await prisma.barang.update({
        where: { id: barang.id },
        data: { status: 'DALAM_PERBAIKAN' }
      })
      await logBarangUpdate(actor, barang, updated)
    }
  }
}
