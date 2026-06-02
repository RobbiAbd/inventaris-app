import { prisma } from './db'
import { EVIDENCE_MAX_FILES } from '../../shared/constants/evidence'
import { deleteEvidenceFile, saveEvidenceFile } from './evidence'
import { notDeleted } from './softDelete'

export function serializeBarangEvidence(evidence: {
  id: number
  filePath: string
  originalName: string
  mimeType: string
  fileSize: number
  sortOrder: number
  createdAt: Date
}) {
  return {
    id: evidence.id,
    url: `/${evidence.filePath.replace(/\\/g, '/')}`,
    originalName: evidence.originalName,
    mimeType: evidence.mimeType,
    fileSize: evidence.fileSize,
    sortOrder: evidence.sortOrder,
    createdAt: evidence.createdAt.toISOString()
  }
}

export async function countBarangEvidence(barangId: number) {
  return prisma.barangEvidence.count({ where: { barangId } })
}

export async function uploadBarangEvidence(
  barangId: number,
  parts: Array<{ filename?: string | null, type?: string, data?: Buffer }>
) {
  if (!parts.length) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada file yang diunggah' })
  }

  const existingCount = await countBarangEvidence(barangId)

  if (existingCount + parts.length > EVIDENCE_MAX_FILES) {
    throw createError({
      statusCode: 400,
      statusMessage: `Maksimal ${EVIDENCE_MAX_FILES} gambar evidence per barang`
    })
  }

  const created = []

  for (const [index, part] of parts.entries()) {
    const saved = await saveEvidenceFile(barangId, part)
    const record = await prisma.barangEvidence.create({
      data: {
        barangId,
        filePath: saved.filePath,
        originalName: saved.originalName,
        mimeType: saved.mimeType,
        fileSize: saved.fileSize,
        sortOrder: existingCount + index
      }
    })
    created.push(serializeBarangEvidence(record))
  }

  return created
}

export async function removeBarangEvidence(barangId: number, evidenceId: number) {
  const evidence = await prisma.barangEvidence.findFirst({
    where: { id: evidenceId, barangId }
  })

  if (!evidence) {
    throw createError({ statusCode: 404, statusMessage: 'Evidence tidak ditemukan' })
  }

  await deleteEvidenceFile(evidence.filePath)
  await prisma.barangEvidence.delete({ where: { id: evidenceId } })

  return evidence
}

export async function assertBarangExists(barangId: number) {
  const barang = await prisma.barang.findFirst({
    where: { id: barangId, ...notDeleted }
  })

  if (!barang) {
    throw createError({ statusCode: 404, statusMessage: 'Barang tidak ditemukan' })
  }

  return barang
}
