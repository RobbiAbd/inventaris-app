import type { Prisma } from '@prisma/client'
import { prisma } from '../../utils/db'
import { barangScopeForUser, requireSession } from '../../utils/auth'
import { barangInclude, serializeBarang } from '../../utils/barang'
import { notDeleted } from '../../utils/softDelete'
import { buildPagination, parsePagination } from '../../utils/pagination'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const user = await requireSession(event)

  const query = getQuery(event)
  const { page, limit, skip } = parsePagination(query)
  const search = (query.search as string)?.trim()
  const kategori = (query.kategori as string)?.trim()
  const status = (query.status as string | undefined)?.trim()

  const where: Prisma.BarangWhereInput = {
    ...notDeleted,
    ...barangScopeForUser(user),
    ...(search && {
      OR: [
        { nama: { contains: search } },
        { kategori: { contains: search } },
        { merk: { contains: search } },
        { nomorSeri: { contains: search } },
        { lokasi: { contains: search } }
      ]
    }),
    ...(kategori && { kategori }),
    ...(status && { status })
  }

  const [items, total] = await Promise.all([
    prisma.barang.findMany({
      where,
      include: barangInclude,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.barang.count({ where })
  ])

  return successResponse('Data barang berhasil diambil', {
    items: items.map(serializeBarang),
    pagination: buildPagination(page, limit, total)
  })
})
