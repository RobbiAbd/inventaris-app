import { prisma } from '../../utils/db'
import { requireHrd } from '../../utils/auth'
import { logUserDelete } from '../../utils/history'
import { activeBarangCountSelect, assertActive, notDeleted, releaseUniqueValue } from '../../utils/softDelete'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const currentUser = await requireHrd(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID pengguna tidak valid' })
  }

  if (currentUser.id === id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tidak dapat menghapus akun yang sedang digunakan.'
    })
  }

  const existing = assertActive(
    await prisma.user.findFirst({
      where: { id, ...notDeleted },
      include: { _count: { select: activeBarangCountSelect } }
    }),
    'Pengguna tidak ditemukan'
  )

  if (existing.role === 'HRD') {
    const hrdCount = await prisma.user.count({ where: { role: 'HRD', ...notDeleted } })
    if (hrdCount <= 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Tidak dapat menghapus satu-satunya pengguna HRD.'
      })
    }
  }

  await prisma.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      email: releaseUniqueValue(existing.email, id)!
    }
  })

  await logUserDelete({ id: currentUser.id, nama: currentUser.nama }, existing)

  return successResponse('Pengguna berhasil dihapus')
})
