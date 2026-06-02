import type { PerbaikanInput } from '../../shared/types/perbaikan'
import type { Prisma } from '@prisma/client'
import { prisma } from './db'
import { serializePerbaikanEvidence } from './perbaikanEvidence'

export function serializePerbaikan(record: {
  id: number
  barangId: number
  tanggal: Date
  deskripsi: string
  biaya: { toString(): string } | null
  lokasiServis: string | null
  statusSebelum: string | null
  statusSesudah: string | null
  catatan: string | null
  createdById: number | null
  createdAt: Date
  updatedAt: Date
  createdBy?: { id: number, nama: string } | null
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
    id: record.id,
    barangId: record.barangId,
    tanggal: record.tanggal.toISOString(),
    deskripsi: record.deskripsi,
    biaya: record.biaya?.toString() ?? null,
    lokasiServis: record.lokasiServis,
    statusSebelum: record.statusSebelum,
    statusSesudah: record.statusSesudah,
    catatan: record.catatan,
    createdById: record.createdById,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    createdBy: record.createdBy ?? null,
    evidence: (record.evidence ?? []).map(serializePerbaikanEvidence)
  }
}

export function parsePerbaikanInput(data: PerbaikanInput, statusSebelum?: string | null) {
  return {
    tanggal: new Date(data.tanggal),
    deskripsi: data.deskripsi.trim(),
    biaya: data.biaya != null ? data.biaya : null,
    lokasiServis: data.lokasiServis?.trim() || null,
    statusSebelum: statusSebelum ?? null,
    statusSesudah: data.statusSesudah || null,
    catatan: data.catatan?.trim() || null
  }
}

export const perbaikanInclude = {
  createdBy: {
    select: { id: true, nama: true }
  },
  evidence: {
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
  }
} satisfies Prisma.BarangPerbaikanInclude

export async function listBarangPerbaikan(barangId: number) {
  const items = await prisma.barangPerbaikan.findMany({
    where: { barangId },
    include: perbaikanInclude,
    orderBy: [{ tanggal: 'desc' }, { id: 'desc' }]
  })

  return items.map(serializePerbaikan)
}

export async function createBarangPerbaikan(
  barangId: number,
  data: PerbaikanInput,
  actor: { id: number },
  statusSebelum?: string | null
) {
  const record = await prisma.barangPerbaikan.create({
    data: {
      barangId,
      ...parsePerbaikanInput(data, statusSebelum),
      createdById: actor.id
    },
    include: perbaikanInclude
  })

  return serializePerbaikan(record)
}
