import { prisma } from '../../utils/db'
import { assertBarangAccess, requireSession } from '../../utils/auth'
import { findActivityLogs } from '../../utils/history'
import { successResponse } from '../../utils/response'
import { ENTITY_TYPES, type EntityType } from '../../../shared/types/history'
import { notDeleted } from '../../utils/softDelete'

export default defineEventHandler(async (event) => {
  const user = await requireSession(event)

  const query = getQuery(event)
  const page = Math.max(Number(query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 50)
  const entityType = query.entityType as EntityType | undefined
  const entityId = query.entityId ? Number(query.entityId) : undefined

  if (entityType === ENTITY_TYPES.BARANG && entityId) {
    const barang = await prisma.barang.findFirst({
      where: { id: entityId, ...notDeleted },
      select: { userId: true }
    })

    if (!barang) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Barang tidak ditemukan'
      })
    }

    assertBarangAccess(user, barang)
  }

  const result = await findActivityLogs({
    entityType,
    entityId,
    page,
    limit
  })

  return successResponse('Riwayat aktivitas berhasil diambil', result)
})
