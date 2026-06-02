import { assertBarangAccess, requireSession } from '../../../utils/auth'
import { assertActive, notDeleted } from '../../../utils/softDelete'
import { prisma } from '../../../utils/db'
import { listBarangPerbaikan } from '../../../utils/perbaikan'
import { successResponse } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  const user = await requireSession(event)
  const barangId = Number(getRouterParam(event, 'id'))

  if (!barangId) {
    throw createError({ statusCode: 400, statusMessage: 'ID barang tidak valid' })
  }

  const barang = assertActive(
    await prisma.barang.findFirst({ where: { id: barangId, ...notDeleted } }),
    'Barang tidak ditemukan'
  )

  assertBarangAccess(user, barang)

  const items = await listBarangPerbaikan(barangId)
  return successResponse('Riwayat perbaikan berhasil diambil', items)
})
