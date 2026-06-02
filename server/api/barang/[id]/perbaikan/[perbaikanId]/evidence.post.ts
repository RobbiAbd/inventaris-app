import { assertBarangAccess, requireHrd } from '../../../../../utils/auth'
import { assertActive, notDeleted } from '../../../../../utils/softDelete'
import { prisma } from '../../../../../utils/db'
import {
  assertPerbaikanBelongsToBarang,
  uploadPerbaikanEvidence
} from '../../../../../utils/perbaikanEvidence'
import { successResponse } from '../../../../../utils/response'

export default defineEventHandler(async (event) => {
  const user = await requireHrd(event)

  const barangId = Number(getRouterParam(event, 'id'))
  const perbaikanId = Number(getRouterParam(event, 'perbaikanId'))

  if (!barangId || !perbaikanId) {
    throw createError({ statusCode: 400, statusMessage: 'ID tidak valid' })
  }

  const barang = assertActive(
    await prisma.barang.findFirst({ where: { id: barangId, ...notDeleted } }),
    'Barang tidak ditemukan'
  )

  assertBarangAccess(user, barang)

  const perbaikan = await assertPerbaikanBelongsToBarang(barangId, perbaikanId)

  const form = await readMultipartFormData(event)
  const fileParts = (form ?? []).filter(part => part.name === 'files' && part.filename && part.data)

  const created = await uploadPerbaikanEvidence(perbaikan.id, fileParts)

  return successResponse('Evidence perbaikan berhasil diunggah', created)
})
