import { prisma } from '../../utils/db'
import { requireHrd } from '../../utils/auth'
import { serializeVendor } from '../../utils/vendor'
import { activeBarangCountSelect, notDeleted } from '../../utils/softDelete'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  await requireHrd(event)

  const query = getQuery(event)
  const jenis = (query.jenis as string)?.trim()
  const search = (query.search as string)?.trim()

  const vendors = await prisma.vendor.findMany({
    where: {
      ...notDeleted,
      ...(jenis && { jenis }),
      ...(search && {
        OR: [
          { nama: { contains: search } },
          { kontak: { contains: search } },
          { telepon: { contains: search } }
        ]
      })
    },
    include: {
      _count: { select: activeBarangCountSelect }
    },
    orderBy: { nama: 'asc' }
  })

  return successResponse('Daftar vendor berhasil diambil', vendors.map(serializeVendor))
})
