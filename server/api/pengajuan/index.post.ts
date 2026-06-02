import { assertBarangAccess, requireSession } from '../../utils/auth'
import { createPengajuanSchema } from '../../../shared/types/pengajuan'
import { prisma } from '../../utils/db'
import { createPengajuan } from '../../utils/pengajuan'
import { assertActive, notDeleted } from '../../utils/softDelete'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const user = await requireSession(event)
  const body = await readBody(event)
  const parsed = createPengajuanSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Data pengajuan tidak valid'
    })
  }

  const barang = assertActive(
    await prisma.barang.findFirst({
      where: { id: parsed.data.barangId, ...notDeleted }
    }),
    'Barang tidak ditemukan'
  )

  assertBarangAccess(user, barang)

  const pengajuan = await createPengajuan(user.id, parsed.data)

  return successResponse('Pengajuan berhasil dikirim', pengajuan)
})
