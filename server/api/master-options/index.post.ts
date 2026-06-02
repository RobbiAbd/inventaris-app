import type { Prisma } from '@prisma/client'
import { masterOptionSchema } from '../../../shared/types/master'
import { prisma } from '../../utils/db'
import { requireHrd } from '../../utils/auth'
import { logMasterCreate } from '../../utils/history'
import { serializeMasterOption } from '../../utils/master'
import { notDeleted } from '../../utils/softDelete'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const actor = await requireHrd(event)

  const body = await readBody(event)
  const parsed = masterOptionSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Data master tidak valid'
    })
  }

  const existing = await prisma.masterOption.findFirst({
    where: {
      group: parsed.data.group,
      kode: parsed.data.kode,
      ...notDeleted
    }
  })

  if (existing) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Kode sudah digunakan di grup ini'
    })
  }

  const option = await prisma.masterOption.create({
    data: {
      group: parsed.data.group,
      kode: parsed.data.kode,
      label: parsed.data.label,
      sortOrder: parsed.data.sortOrder ?? 0,
      isActive: parsed.data.isActive ?? true,
      config: parsed.data.config != null
        ? (parsed.data.config as Prisma.InputJsonValue)
        : undefined
    }
  })

  await logMasterCreate(actor, option)

  return successResponse('Master data berhasil ditambahkan', serializeMasterOption(option))
})
