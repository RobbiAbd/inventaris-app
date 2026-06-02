import { prisma } from '../../utils/db'
import { requireHrd } from '../../utils/auth'
import { logVendorUpdate } from '../../utils/history'
import { parseVendorInput, serializeVendor } from '../../utils/vendor'
import { activeBarangCountSelect, assertActive, notDeleted } from '../../utils/softDelete'
import { parseAndValidateVendor } from '../../utils/validation'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const actor = await requireHrd(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID vendor tidak valid' })
  }

  const body = await readBody(event)
  const parsed = await parseAndValidateVendor(body)

  const existing = assertActive(
    await prisma.vendor.findFirst({ where: { id, ...notDeleted } }),
    'Vendor tidak ditemukan'
  )

  const updateData = parseVendorInput(parsed)

  const vendor = await prisma.vendor.update({
    where: { id },
    data: updateData,
    include: { _count: { select: activeBarangCountSelect } }
  })

  await logVendorUpdate(actor, existing, { ...existing, ...updateData })

  return successResponse('Vendor berhasil diperbarui', serializeVendor(vendor))
})
