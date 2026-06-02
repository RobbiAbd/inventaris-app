import { requireHrd } from '../../../../utils/auth'
import { assertBarangExists, removeBarangEvidence } from '../../../../utils/barangEvidence'
import { successResponse } from '../../../../utils/response'

export default defineEventHandler(async (event) => {
  await requireHrd(event)

  const barangId = Number(getRouterParam(event, 'id'))
  const evidenceId = Number(getRouterParam(event, 'evidenceId'))

  if (!barangId || !evidenceId) {
    throw createError({ statusCode: 400, statusMessage: 'ID tidak valid' })
  }

  await assertBarangExists(barangId)
  await removeBarangEvidence(barangId, evidenceId)

  return successResponse('Evidence berhasil dihapus')
})
