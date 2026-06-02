import { prisma } from '../../utils/db'
import { assertBarangAccess, requireSession } from '../../utils/auth'
import { barangInclude, serializeBarang } from '../../utils/barang'
import { assertActive, notDeleted } from '../../utils/softDelete'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const user = await requireSession(event)

  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID barang tidak valid'
    })
  }

  const barang = assertActive(
    await prisma.barang.findFirst({ where: { id, ...notDeleted }, include: barangInclude }),
    'Barang tidak ditemukan'
  )

  assertBarangAccess(user, barang)

  return successResponse('Detail barang berhasil diambil', serializeBarang(barang))
})
