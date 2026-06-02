import { prisma } from '../../utils/db'
import { requireHrd } from '../../utils/auth'
import { logVendorCreate } from '../../utils/history'
import { parseVendorInput, serializeVendor } from '../../utils/vendor'
import { activeBarangCountSelect } from '../../utils/softDelete'
import { parseAndValidateVendor } from '../../utils/validation'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const actor = await requireHrd(event)

  const body = await readBody(event)
  const parsed = await parseAndValidateVendor(body)

  const vendor = await prisma.vendor.create({
    data: parseVendorInput(parsed),
    include: { _count: { select: activeBarangCountSelect } }
  })

  await logVendorCreate(actor, vendor)

  return successResponse('Vendor berhasil ditambahkan', serializeVendor(vendor))
})
