import { prisma } from '../../utils/db'
import { requireHrd } from '../../utils/auth'
import { logBarangDelete } from '../../utils/history'
import { assertActive, notDeleted, releaseUniqueValue } from '../../utils/softDelete'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const actor = await requireHrd(event)

  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID barang tidak valid'
    })
  }

  const existing = assertActive(await prisma.barang.findFirst({ where: { id, ...notDeleted } }), 'Barang tidak ditemukan')

  await prisma.barang.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      nomorSeri: releaseUniqueValue(existing.nomorSeri, id)
    }
  })

  await logBarangDelete(actor, existing)

  return successResponse('Barang berhasil dihapus')
})
