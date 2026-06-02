import { requireHrd } from '../../../utils/auth'
import { reviewPengajuanSchema } from '../../../../shared/types/pengajuan'
import { PENGAJUAN_STATUS } from '../../../../shared/types/pengajuan'
import { prisma } from '../../../utils/db'
import { applyPengajuanApproval, pengajuanInclude, serializePengajuan } from '../../../utils/pengajuan'
import { successResponse } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  const reviewer = await requireHrd(event)
  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID pengajuan tidak valid' })
  }

  const body = await readBody(event)
  const parsed = reviewPengajuanSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Data review tidak valid'
    })
  }

  const existing = await prisma.barangPengajuan.findUnique({
    where: { id },
    include: pengajuanInclude
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Pengajuan tidak ditemukan' })
  }

  if (existing.status !== PENGAJUAN_STATUS.MENUNGGU) {
    throw createError({ statusCode: 400, statusMessage: 'Pengajuan sudah diproses' })
  }

  if (parsed.data.action === 'approve') {
    await applyPengajuanApproval(existing, reviewer)
  }

  const updated = await prisma.barangPengajuan.update({
    where: { id },
    data: {
      status: parsed.data.action === 'approve'
        ? PENGAJUAN_STATUS.DISETUJUI
        : PENGAJUAN_STATUS.DITOLAK,
      catatanReviewer: parsed.data.catatanReviewer?.trim() || null,
      reviewedById: reviewer.id,
      reviewedAt: new Date()
    },
    include: pengajuanInclude
  })

  return successResponse(
    parsed.data.action === 'approve' ? 'Pengajuan disetujui' : 'Pengajuan ditolak',
    serializePengajuan(updated)
  )
})
