import type { Prisma, Role } from '@prisma/client'
import { prisma } from '../../utils/db'
import { requireHrd } from '../../utils/auth'
import { serializeUser } from '../../utils/user'
import { activeBarangCountSelect, notDeleted } from '../../utils/softDelete'
import { buildPagination, parsePagination } from '../../utils/pagination'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  await requireHrd(event)

  const query = getQuery(event)
  const { all, page, limit, skip } = parsePagination(query)
  const search = (query.search as string)?.trim()
  const role = (query.role as string)?.trim()

  const where: Prisma.UserWhereInput = {
    ...notDeleted,
    ...(role && { role: role as Role }),
    ...(search && {
      OR: [
        { nama: { contains: search } },
        { email: { contains: search } }
      ]
    })
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: activeBarangCountSelect }
      },
      orderBy: { nama: 'asc' },
      ...(all ? {} : { skip, take: limit })
    }),
    prisma.user.count({ where })
  ])

  const effectiveLimit = all ? total || limit : limit
  const effectivePage = all ? 1 : page

  return successResponse('Daftar pengguna berhasil diambil', {
    items: users.map(serializeUser),
    pagination: buildPagination(effectivePage, effectiveLimit, total)
  })
})
