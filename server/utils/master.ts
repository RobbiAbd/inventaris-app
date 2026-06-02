import type { MasterGroup, MasterOptionItem } from '../../shared/types/master'
import { MASTER_GROUPS } from '../../shared/types/master'
import { notDeleted } from './softDelete'
import { prisma } from './db'

export function serializeMasterOption(option: {
  id: number
  group: string
  kode: string
  label: string
  config: unknown
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}): MasterOptionItem {
  return {
    id: option.id,
    group: option.group as MasterGroup,
    kode: option.kode,
    label: option.label,
    config: (option.config as Record<string, unknown> | null) ?? null,
    sortOrder: option.sortOrder,
    isActive: option.isActive,
    createdAt: option.createdAt.toISOString(),
    updatedAt: option.updatedAt.toISOString()
  }
}

export async function getMasterOptions(activeOnly = true) {
  const options = await prisma.masterOption.findMany({
    where: {
      ...notDeleted,
      ...(activeOnly ? { isActive: true } : {})
    },
    orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }, { label: 'asc' }]
  })

  return options.map(serializeMasterOption)
}

export async function getMasterOptionsByGroup(group: MasterGroup, activeOnly = true) {
  const options = await prisma.masterOption.findMany({
    where: {
      group,
      ...notDeleted,
      ...(activeOnly ? { isActive: true } : {})
    },
    orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }]
  })

  return options.map(serializeMasterOption)
}

export async function getMasterOptionsMap(activeOnly = true) {
  const all = await getMasterOptions(activeOnly)

  return {
    [MASTER_GROUPS.JENIS_VENDOR]: all.filter((o: MasterOptionItem) => o.group === MASTER_GROUPS.JENIS_VENDOR),
    [MASTER_GROUPS.KATEGORI_BARANG]: all.filter((o: MasterOptionItem) => o.group === MASTER_GROUPS.KATEGORI_BARANG),
    [MASTER_GROUPS.STATUS_BARANG]: all.filter((o: MasterOptionItem) => o.group === MASTER_GROUPS.STATUS_BARANG),
    [MASTER_GROUPS.TIPE_PEROLEHAN]: all.filter((o: MasterOptionItem) => o.group === MASTER_GROUPS.TIPE_PEROLEHAN)
  }
}

export async function validateMasterKode(group: MasterGroup, kode: string) {
  const option = await prisma.masterOption.findFirst({
    where: { group, kode, isActive: true, ...notDeleted }
  })

  if (!option) {
    throw createError({
      statusCode: 400,
      statusMessage: `Nilai "${kode}" tidak valid untuk ${group}`
    })
  }

  return serializeMasterOption(option)
}
