import type { Prisma } from '@prisma/client'
import { masterOptionSchema } from '../../../shared/types/master'
import type { MasterGroup } from '../../../shared/types/master'
import { prisma } from '../../utils/db'
import { requireHrd, requireSession } from '../../utils/auth'
import { getMasterOptions, serializeMasterOption } from '../../utils/master'
import { notDeleted } from '../../utils/softDelete'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  await requireSession(event)

  const query = getQuery(event)
  const includeInactive = query.includeInactive === 'true'
  const group = query.group as MasterGroup | undefined

  if (group) {
    const options = await prisma.masterOption.findMany({
      where: {
        group,
        ...notDeleted,
        ...(includeInactive ? {} : { isActive: true })
      },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }]
    })
    return successResponse('Master data berhasil diambil', options.map(serializeMasterOption))
  }

  const options = await getMasterOptions(!includeInactive)
  return successResponse('Master data berhasil diambil', options)
})
