import { prisma } from '../../utils/db'
import { requireHrd } from '../../utils/auth'
import { serializeUser } from '../../utils/user'
import { activeBarangCountSelect, notDeleted } from '../../utils/softDelete'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  await requireHrd(event)

  const query = getQuery(event)
  const search = (query.search as string)?.trim()

  const users = await prisma.user.findMany({
    where: {
      ...notDeleted,
      ...(search && {
        OR: [
          { nama: { contains: search } },
          { email: { contains: search } }
        ]
      })
    },
    select: {
      id: true,
      nama: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: activeBarangCountSelect }
    },
    orderBy: { nama: 'asc' }
  })

  return successResponse('Daftar pengguna berhasil diambil', users.map(serializeUser))
})
