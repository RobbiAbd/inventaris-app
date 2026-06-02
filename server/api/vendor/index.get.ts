import type { Prisma } from '@prisma/client'
import { prisma } from '../../utils/db'
import { requireHrd } from '../../utils/auth'
import { serializeVendor } from '../../utils/vendor'
import { activeBarangCountSelect, notDeleted } from '../../utils/softDelete'
import { buildPagination, parsePagination } from '../../utils/pagination'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  await requireHrd(event)

  const query = getQuery(event)
  const { all, page, limit, skip } = parsePagination(query)
  const jenis = (query.jenis as string)?.trim()
  const search = (query.search as string)?.trim()

  const where: Prisma.VendorWhereInput = {
    ...notDeleted,
    ...(jenis && { jenis }),
    ...(search && {
      OR: [
        { nama: { contains: search } },
        { kontak: { contains: search } },
        { telepon: { contains: search } }
      ]
    })
  }

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      include: {
        _count: { select: activeBarangCountSelect }
      },
      orderBy: { nama: 'asc' },
      ...(all ? {} : { skip, take: limit })
    }),
    prisma.vendor.count({ where })
  ])

  const effectiveLimit = all ? total || limit : limit
  const effectivePage = all ? 1 : page

  return successResponse('Daftar vendor berhasil diambil', {
    items: vendors.map(serializeVendor),
    pagination: buildPagination(effectivePage, effectiveLimit, total)
  })
})
