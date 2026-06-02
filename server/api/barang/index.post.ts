import { prisma } from '../../utils/db'
import { requireHrd } from '../../utils/auth'
import { barangInclude, parseBarangInput, serializeBarang, validateBarangRelations } from '../../utils/barang'
import { logBarangCreate } from '../../utils/history'
import { parseAndValidateBarang } from '../../utils/validation'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const actor = await requireHrd(event)

  const body = await readBody(event)
  const parsed = await parseAndValidateBarang(body)

  await validateBarangRelations(parsed)

  try {
    const barang = await prisma.barang.create({
      data: parseBarangInput(parsed),
      include: barangInclude
    })

    await logBarangCreate(actor, barang)

    return successResponse('Barang berhasil ditambahkan', serializeBarang(barang))
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
