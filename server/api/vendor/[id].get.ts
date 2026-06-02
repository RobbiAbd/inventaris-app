import { prisma } from '../../utils/db'
import { requireHrd } from '../../utils/auth'
import { serializeVendor } from '../../utils/vendor'
import { activeBarangCountSelect, assertActive, notDeleted } from '../../utils/softDelete'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  await requireHrd(event)

  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID vendor tidak valid'
    })
  }

  const vendor = assertActive(
    await prisma.vendor.findFirst({
      where: { id, ...notDeleted },
      include: { _count: { select: activeBarangCountSelect } }
    }),
    'Vendor tidak ditemukan'
  )

  return successResponse('Detail vendor berhasil diambil', serializeVendor(vendor))
})
