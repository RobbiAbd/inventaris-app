import { prisma } from './db'
import { EVIDENCE_MAX_FILES } from '../../shared/constants/evidence'
import { saveEvidenceFile, serializeEvidenceRecord } from './evidence'
import { notDeleted } from './softDelete'

export const serializePerbaikanEvidence = serializeEvidenceRecord

export async function countPerbaikanEvidence(perbaikanId: number) {
  return prisma.perbaikanEvidence.count({ where: { perbaikanId } })
}

export async function uploadPerbaikanEvidence(
  perbaikanId: number,
  parts: Array<{ filename?: string | null, type?: string, data?: Buffer }>
) {
  if (!parts.length) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada file yang diunggah' })
  }

  const existingCount = await countPerbaikanEvidence(perbaikanId)

  if (existingCount + parts.length > EVIDENCE_MAX_FILES) {
    throw createError({
      statusCode: 400,
      statusMessage: `Maksimal ${EVIDENCE_MAX_FILES} gambar evidence per perbaikan`
    })
  }

  const created = []

  for (const [index, part] of parts.entries()) {
    const saved = await saveEvidenceFile('perbaikan', perbaikanId, part)
    const record = await prisma.perbaikanEvidence.create({
      data: {
        perbaikanId,
        filePath: saved.filePath,
        originalName: saved.originalName,
        mimeType: saved.mimeType,
        fileSize: saved.fileSize,
        sortOrder: existingCount + index
      }
    })
    created.push(serializePerbaikanEvidence(record))
  }

  return created
}

export async function assertPerbaikanBelongsToBarang(
  barangId: number,
  perbaikanId: number
) {
  const perbaikan = await prisma.barangPerbaikan.findFirst({
    where: {
      id: perbaikanId,
      barangId,
      barang: { ...notDeleted }
    }
  })

  if (!perbaikan) {
    throw createError({ statusCode: 404, statusMessage: 'Riwayat perbaikan tidak ditemukan' })
  }

  return perbaikan
}
