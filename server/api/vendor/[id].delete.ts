import { prisma } from '../../utils/db'
import { requireHrd } from '../../utils/auth'
import { logVendorDelete } from '../../utils/history'
import { activeBarangCountSelect, assertActive, notDeleted } from '../../utils/softDelete'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const actor = await requireHrd(event)

  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID vendor tidak valid'
    })
  }

  const existing = assertActive(
    await prisma.vendor.findFirst({
      where: { id, ...notDeleted },
      include: { _count: { select: activeBarangCountSelect } }
    }),
    'Vendor tidak ditemukan'
  )

  if (existing._count.barang > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Vendor masih digunakan oleh barang. Hapus atau pindahkan barang terlebih dahulu.'
    })
  }

  await prisma.vendor.update({
    where: { id },
    data: { deletedAt: new Date() }
  })

  await logVendorDelete(actor, existing)

  return successResponse('Vendor berhasil dihapus')
})
