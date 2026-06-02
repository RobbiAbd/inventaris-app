import { assertBarangAccess, requireHrd, requireSession } from '../../../utils/auth'
import { assertActive, notDeleted } from '../../../utils/softDelete'
import { prisma } from '../../../utils/db'
import { perbaikanInputSchema } from '../../../../shared/types/perbaikan'
import { createBarangPerbaikan } from '../../../utils/perbaikan'
import { logBarangUpdate } from '../../../utils/history'
import { successResponse } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  const user = await requireHrd(event)
  const barangId = Number(getRouterParam(event, 'id'))

  if (!barangId) {
    throw createError({ statusCode: 400, statusMessage: 'ID barang tidak valid' })
  }

  const barang = assertActive(
    await prisma.barang.findFirst({ where: { id: barangId, ...notDeleted } }),
    'Barang tidak ditemukan'
  )

  assertBarangAccess(user, barang)

  const body = await readBody(event)
  const parsed = perbaikanInputSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Data perbaikan tidak valid'
    })
  }

  const perbaikan = await createBarangPerbaikan(
    barangId,
    parsed.data,
    user,
    barang.status
  )

  if (parsed.data.statusSesudah && parsed.data.statusSesudah !== barang.status) {
    const updated = await prisma.barang.update({
      where: { id: barangId },
      data: { status: parsed.data.statusSesudah }
    })
    await logBarangUpdate(user, barang, updated)
  }

  return successResponse('Riwayat perbaikan berhasil ditambahkan', perbaikan)
})
