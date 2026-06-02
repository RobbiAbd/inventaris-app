import { prisma } from '../../utils/db'
import { requireHrd } from '../../utils/auth'
import { serializeUser } from '../../utils/user'
import { activeBarangCountSelect, assertActive, notDeleted } from '../../utils/softDelete'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  await requireHrd(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID pengguna tidak valid' })
  }

  const user = assertActive(
    await prisma.user.findFirst({
      where: { id, ...notDeleted },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: activeBarangCountSelect }
      }
    }),
    'Pengguna tidak ditemukan'
  )

  return successResponse('Detail pengguna berhasil diambil', serializeUser(user))
})
