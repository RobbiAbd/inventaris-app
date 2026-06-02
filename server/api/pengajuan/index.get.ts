import type { Prisma } from '@prisma/client'
import { isHrd, requireSession } from '../../utils/auth'
import { prisma } from '../../utils/db'
import { pengajuanInclude, serializePengajuan } from '../../utils/pengajuan'
import { notDeleted } from '../../utils/softDelete'
import { buildPagination, parsePagination } from '../../utils/pagination'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const user = await requireSession(event)
  const query = getQuery(event)
  const { page, limit, skip } = parsePagination(query)
  const status = (query.status as string)?.trim()
  const mineOnly = query.mine === 'true'

  const where: Prisma.BarangPengajuanWhereInput = {
    ...(status && { status }),
    ...(!isHrd(user.role) || mineOnly ? { userId: user.id } : {}),
    barang: { ...notDeleted }
  }

  const [items, total] = await Promise.all([
    prisma.barangPengajuan.findMany({
      where,
      include: pengajuanInclude,
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: limit
    }),
    prisma.barangPengajuan.count({ where })
  ])

  return successResponse('Daftar pengajuan berhasil diambil', {
    items: items.map(serializePengajuan),
    pagination: buildPagination(page, limit, total)
  })
})
