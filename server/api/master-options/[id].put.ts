import { Prisma } from '@prisma/client'
import { masterOptionSchema } from '../../../shared/types/master'
import { prisma } from '../../utils/db'
import { requireHrd } from '../../utils/auth'
import { logMasterUpdate } from '../../utils/history'
import { serializeMasterOption } from '../../utils/master'
import { assertActive, notDeleted } from '../../utils/softDelete'
import { successResponse } from '../../utils/response'

const updateSchema = masterOptionSchema.omit({ group: true, kode: true }).extend({
  kode: masterOptionSchema.shape.kode.optional()
})

export default defineEventHandler(async (event) => {
  const actor = await requireHrd(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID tidak valid' })
  }

  const existing = assertActive(
    await prisma.masterOption.findFirst({ where: { id, ...notDeleted } }),
    'Master data tidak ditemukan'
  )

  const body = await readBody(event)
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Data master tidak valid'
    })
  }

  const updateData = {
    label: parsed.data.label,
    sortOrder: parsed.data.sortOrder,
    isActive: parsed.data.isActive,
    config: parsed.data.config === undefined
      ? undefined
      : parsed.data.config === null
        ? Prisma.DbNull
        : (parsed.data.config as Prisma.InputJsonValue)
  }

  const option = await prisma.masterOption.update({
    where: { id },
    data: updateData
  })

  await logMasterUpdate(actor, existing, { ...existing, ...updateData, config: parsed.data.config ?? existing.config })

  return successResponse('Master data berhasil diperbarui', serializeMasterOption(option))
})
