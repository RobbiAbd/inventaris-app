import { prisma } from '../../utils/db'
import { requireHrd } from '../../utils/auth'
import { barangInclude, parseBarangInput, serializeBarang, validateBarangRelations } from '../../utils/barang'
import { logBarangUpdate } from '../../utils/history'
import { assertActive, notDeleted } from '../../utils/softDelete'
import { parseAndValidateBarang } from '../../utils/validation'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const actor = await requireHrd(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID barang tidak valid' })
  }

  const body = await readBody(event)
  const parsed = await parseAndValidateBarang(body)

  const existing = assertActive(
    await prisma.barang.findFirst({ where: { id, ...notDeleted } }),
    'Barang tidak ditemukan'
  )

  await validateBarangRelations(parsed)

  const updateData = parseBarangInput(parsed)

  try {
    const barang = await prisma.barang.update({
      where: { id },
      data: updateData,
      include: barangInclude
    })

    await logBarangUpdate(actor, existing, { ...existing, ...updateData })

    return successResponse('Barang berhasil diperbarui', serializeBarang(barang))
  } catch (error: unknown) {
    const prismaError = error as { code?: string }

    if (prismaError.code === 'P2002') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nomor seri sudah digunakan barang lain'
      })
    }

    throw error
  }
})
