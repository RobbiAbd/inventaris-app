import { requireHrd } from '../../../utils/auth'
import { assertBarangExists, uploadBarangEvidence } from '../../../utils/barangEvidence'
import { successResponse } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  await requireHrd(event)

  const barangId = Number(getRouterParam(event, 'id'))
  if (!barangId) {
    throw createError({ statusCode: 400, statusMessage: 'ID barang tidak valid' })
  }

  await assertBarangExists(barangId)

  const form = await readMultipartFormData(event)
  const fileParts = (form ?? []).filter(part => part.name === 'files' && part.filename && part.data)

  const created = await uploadBarangEvidence(barangId, fileParts)

  return successResponse('Evidence berhasil diunggah', created)
})
