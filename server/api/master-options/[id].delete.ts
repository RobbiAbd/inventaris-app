import { prisma } from '../../utils/db'
import { requireHrd } from '../../utils/auth'
import { logMasterDelete } from '../../utils/history'
import { assertActive, notDeleted, releaseUniqueValue } from '../../utils/softDelete'
import { successResponse } from '../../utils/response'
import { MASTER_GROUPS } from '../../../shared/types/master'

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

  const inUse = await checkMasterOptionInUse(existing.group, existing.kode)
  if (inUse) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Data masih digunakan. Nonaktifkan saja jika tidak ingin dipakai lagi.'
    })
  }

  await prisma.masterOption.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      kode: releaseUniqueValue(existing.kode, id)!
    }
  })

  await logMasterDelete(actor, existing)

  return successResponse('Master data berhasil dihapus')
})

async function checkMasterOptionInUse(group: string, kode: string) {
  const activeOnly = { ...notDeleted }

  switch (group) {
    case MASTER_GROUPS.JENIS_VENDOR:
      return (await prisma.vendor.count({ where: { jenis: kode, ...activeOnly } })) > 0
    case MASTER_GROUPS.KATEGORI_BARANG:
      return (await prisma.barang.count({ where: { kategori: kode, ...activeOnly } })) > 0
    case MASTER_GROUPS.STATUS_BARANG:
      return (await prisma.barang.count({ where: { status: kode, ...activeOnly } })) > 0
    case MASTER_GROUPS.TIPE_PEROLEHAN:
      return (await prisma.barang.count({ where: { tipePerolehan: kode, ...activeOnly } })) > 0
    default:
      return false
  }
}
