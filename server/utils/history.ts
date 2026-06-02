import type { Prisma } from '@prisma/client'
import type { ActivityAction, ActivityLogItem, EntityType, HistoryChange } from '../../shared/types/history'
import { ENTITY_TYPES } from '../../shared/types/history'
import { MASTER_GROUP_LABELS, MASTER_GROUPS } from '../../shared/types/master'
import type { MasterGroup } from '../../shared/types/master'
import { roleLabels } from '../../shared/types/user'
import type { UserRole } from '../../shared/types/user'
import { prisma } from './db'
import { formatRupiah } from '../../shared/utils/currency'

type Actor = { id: number, nama: string }

interface FieldConfig {
  key: string
  label: string
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatBool(value: boolean | null | undefined) {
  if (value == null) return null
  return value ? 'Ya' : 'Tidak'
}

function normalize(value: unknown): string | null {
  if (value == null || value === '') return null
  if (value instanceof Date) return formatDate(value)
  if (typeof value === 'boolean') return formatBool(value)
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function diffRecords(
  fields: FieldConfig[],
  oldRecord: Record<string, unknown>,
  newRecord: Record<string, unknown>,
  formatValue?: (key: string, value: unknown) => string | null
): HistoryChange[] {
  const changes: HistoryChange[] = []

  for (const field of fields) {
    const oldRaw = oldRecord[field.key]
    const newRaw = newRecord[field.key]
    const oldFormatted = formatValue ? formatValue(field.key, oldRaw) : normalize(oldRaw)
    const newFormatted = formatValue ? formatValue(field.key, newRaw) : normalize(newRaw)

    if (oldFormatted === newFormatted) continue

    changes.push({
      field: field.key,
      label: field.label,
      oldValue: oldFormatted,
      newValue: newFormatted
    })
  }

  return changes
}

function buildSummary(action: ActivityAction, entityLabel: string, changes: HistoryChange[]) {
  if (action === 'create') return `${entityLabel} ditambahkan`
  if (action === 'delete') return `${entityLabel} dihapus`

  if (changes.length === 1) {
    const change = changes[0]!
    return `${change.label} diubah dari "${change.oldValue ?? '-'}" menjadi "${change.newValue ?? '-'}"`
  }

  return `${entityLabel} diperbarui (${changes.length} perubahan)`
}

class HistoryFormatter {
  private masterLabels = new Map<string, string>()
  private userNames = new Map<number, string>()
  private vendorNames = new Map<number, string>()

  async init() {
    const [masters, users, vendors] = await Promise.all([
      prisma.masterOption.findMany({
        where: { deletedAt: null },
        select: { group: true, kode: true, label: true }
      }),
      prisma.user.findMany({
        where: { deletedAt: null },
        select: { id: true, nama: true }
      }),
      prisma.vendor.findMany({
        where: { deletedAt: null },
        select: { id: true, nama: true }
      })
    ])

    for (const item of masters) {
      this.masterLabels.set(`${item.group}:${item.kode}`, item.label)
    }
    for (const user of users) {
      this.userNames.set(user.id, user.nama)
    }
    for (const vendor of vendors) {
      this.vendorNames.set(vendor.id, vendor.nama)
    }
  }

  masterLabel(group: MasterGroup, kode: string | null | undefined) {
    if (!kode) return null
    return this.masterLabels.get(`${group}:${kode}`) ?? kode
  }

  userName(id: number | null | undefined) {
    if (!id) return null
    return this.userNames.get(id) ?? `User #${id}`
  }

  vendorName(id: number | null | undefined) {
    if (!id) return null
    return this.vendorNames.get(id) ?? `Vendor #${id}`
  }

  formatBarangValue(key: string, value: unknown) {
    switch (key) {
      case 'kategori':
        return this.masterLabel(MASTER_GROUPS.KATEGORI_BARANG, value as string)
      case 'status':
        return this.masterLabel(MASTER_GROUPS.STATUS_BARANG, value as string)
      case 'tipePerolehan':
        return this.masterLabel(MASTER_GROUPS.TIPE_PEROLEHAN, value as string)
      case 'userId':
        return this.userName(value as number | null)
      case 'vendorId':
        return this.vendorName(value as number | null)
      case 'tanggalPembelian':
      case 'tanggalMulaiSewa':
      case 'tanggalAkhirSewa':
        return formatDate(value as Date | string | null)
      case 'harga':
        return value == null ? null : formatRupiah(value as string | number)
      default:
        return normalize(value)
    }
  }

  formatVendorValue(key: string, value: unknown) {
    if (key === 'jenis') {
      return this.masterLabel(MASTER_GROUPS.JENIS_VENDOR, value as string)
    }
    return normalize(value)
  }

  formatMasterValue(key: string, value: unknown) {
    if (key === 'isActive') return formatBool(value as boolean)
    if (key === 'config') {
      if (value == null) return null
      return JSON.stringify(value)
    }
    return normalize(value)
  }
}

async function recordActivity(params: {
  entityType: EntityType
  entityId: number | null
  entityLabel: string
  action: ActivityAction
  summary?: string
  changes?: HistoryChange[] | null
  actor: Actor
}) {
  const changes = params.changes ?? null
  const summary = params.summary ?? buildSummary(params.action, params.entityLabel, changes ?? [])

  await prisma.activityLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      entityLabel: params.entityLabel,
      action: params.action,
      summary,
      changes: changes?.length
        ? (changes as unknown as Prisma.InputJsonValue)
        : undefined,
      actorId: params.actor.id,
      actorNama: params.actor.nama
    }
  })
}

const BARANG_FIELDS: FieldConfig[] = [
  { key: 'nama', label: 'Nama' },
  { key: 'kategori', label: 'Kategori' },
  { key: 'merk', label: 'Merk' },
  { key: 'nomorSeri', label: 'Nomor Seri / Plat' },
  { key: 'status', label: 'Status' },
  { key: 'tipePerolehan', label: 'Tipe Perolehan' },
  { key: 'tanggalPembelian', label: 'Tanggal Pembelian' },
  { key: 'tanggalMulaiSewa', label: 'Tanggal Mulai Sewa' },
  { key: 'tanggalAkhirSewa', label: 'Tanggal Akhir Sewa' },
  { key: 'lokasi', label: 'Lokasi' },
  { key: 'harga', label: 'Harga' },
  { key: 'keterangan', label: 'Keterangan' },
  { key: 'userId', label: 'Ditugaskan ke' },
  { key: 'vendorId', label: 'Vendor' }
]

const VENDOR_FIELDS: FieldConfig[] = [
  { key: 'nama', label: 'Nama Vendor' },
  { key: 'jenis', label: 'Jenis' },
  { key: 'kontak', label: 'Kontak' },
  { key: 'telepon', label: 'Telepon' },
  { key: 'email', label: 'Email' },
  { key: 'alamat', label: 'Alamat' }
]

const USER_FIELDS: FieldConfig[] = [
  { key: 'nama', label: 'Nama' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' }
]

const MASTER_FIELDS: FieldConfig[] = [
  { key: 'label', label: 'Label' },
  { key: 'sortOrder', label: 'Urutan' },
  { key: 'isActive', label: 'Status Aktif' },
  { key: 'config', label: 'Konfigurasi' }
]

export async function logBarangCreate(actor: Actor, barang: Record<string, unknown>) {
  const formatter = new HistoryFormatter()
  await formatter.init()

  await recordActivity({
    entityType: ENTITY_TYPES.BARANG,
    entityId: barang.id as number,
    entityLabel: String(barang.nama),
    action: 'create',
    actor,
    changes: BARANG_FIELDS.map(field => ({
      field: field.key,
      label: field.label,
      oldValue: null,
      newValue: formatter.formatBarangValue(field.key, barang[field.key])
    })).filter(item => item.newValue != null)
  })
}

export async function logBarangUpdate(
  actor: Actor,
  oldRecord: Record<string, unknown>,
  newRecord: Record<string, unknown>
) {
  const formatter = new HistoryFormatter()
  await formatter.init()

  const changes = diffRecords(
    BARANG_FIELDS,
    oldRecord,
    newRecord,
    (key, value) => formatter.formatBarangValue(key, value)
  )

  if (!changes.length) return

  await recordActivity({
    entityType: ENTITY_TYPES.BARANG,
    entityId: oldRecord.id as number,
    entityLabel: String(newRecord.nama ?? oldRecord.nama),
    action: 'update',
    actor,
    changes
  })
}

export async function logBarangDelete(actor: Actor, barang: Record<string, unknown>) {
  await recordActivity({
    entityType: ENTITY_TYPES.BARANG,
    entityId: barang.id as number,
    entityLabel: String(barang.nama),
    action: 'delete',
    actor
  })
}

export async function logVendorCreate(actor: Actor, vendor: Record<string, unknown>) {
  const formatter = new HistoryFormatter()
  await formatter.init()

  await recordActivity({
    entityType: ENTITY_TYPES.VENDOR,
    entityId: vendor.id as number,
    entityLabel: String(vendor.nama),
    action: 'create',
    actor,
    changes: VENDOR_FIELDS.map(field => ({
      field: field.key,
      label: field.label,
      oldValue: null,
      newValue: formatter.formatVendorValue(field.key, vendor[field.key])
    })).filter(item => item.newValue != null)
  })
}

export async function logVendorUpdate(
  actor: Actor,
  oldRecord: Record<string, unknown>,
  newRecord: Record<string, unknown>
) {
  const formatter = new HistoryFormatter()
  await formatter.init()

  const changes = diffRecords(
    VENDOR_FIELDS,
    oldRecord,
    newRecord,
    (key, value) => formatter.formatVendorValue(key, value)
  )

  if (!changes.length) return

  await recordActivity({
    entityType: ENTITY_TYPES.VENDOR,
    entityId: oldRecord.id as number,
    entityLabel: String(newRecord.nama ?? oldRecord.nama),
    action: 'update',
    actor,
    changes
  })
}

export async function logVendorDelete(actor: Actor, vendor: Record<string, unknown>) {
  await recordActivity({
    entityType: ENTITY_TYPES.VENDOR,
    entityId: vendor.id as number,
    entityLabel: String(vendor.nama),
    action: 'delete',
    actor
  })
}

export async function logUserCreate(actor: Actor, user: Record<string, unknown>) {
  await recordActivity({
    entityType: ENTITY_TYPES.USER,
    entityId: user.id as number,
    entityLabel: String(user.nama),
    action: 'create',
    actor,
    changes: USER_FIELDS.map(field => ({
      field: field.key,
      label: field.label,
      oldValue: null,
      newValue: field.key === 'role'
        ? roleLabels[user.role as UserRole] ?? String(user.role)
        : normalize(user[field.key])
    })).filter(item => item.newValue != null)
  })
}

export async function logUserUpdate(
  actor: Actor,
  oldRecord: Record<string, unknown>,
  newRecord: Record<string, unknown>
) {
  const changes = diffRecords(USER_FIELDS, oldRecord, newRecord, (key, value) => {
    if (key === 'role') return roleLabels[value as UserRole] ?? normalize(value)
    return normalize(value)
  })

  if (!changes.length) return

  await recordActivity({
    entityType: ENTITY_TYPES.USER,
    entityId: oldRecord.id as number,
    entityLabel: String(newRecord.nama ?? oldRecord.nama),
    action: 'update',
    actor,
    changes
  })
}

export async function logUserDelete(actor: Actor, user: Record<string, unknown>) {
  await recordActivity({
    entityType: ENTITY_TYPES.USER,
    entityId: user.id as number,
    entityLabel: String(user.nama),
    action: 'delete',
    actor
  })
}

export async function logMasterCreate(actor: Actor, option: Record<string, unknown>) {
  const groupLabel = MASTER_GROUP_LABELS[option.group as MasterGroup] ?? String(option.group)

  await recordActivity({
    entityType: ENTITY_TYPES.MASTER_OPTION,
    entityId: option.id as number,
    entityLabel: `${groupLabel}: ${option.label}`,
    action: 'create',
    actor
  })
}

export async function logMasterUpdate(
  actor: Actor,
  oldRecord: Record<string, unknown>,
  newRecord: Record<string, unknown>
) {
  const formatter = new HistoryFormatter()
  await formatter.init()

  const changes = diffRecords(
    MASTER_FIELDS,
    oldRecord,
    newRecord,
    (key, value) => formatter.formatMasterValue(key, value)
  )

  if (!changes.length) return

  const groupLabel = MASTER_GROUP_LABELS[oldRecord.group as MasterGroup] ?? String(oldRecord.group)

  await recordActivity({
    entityType: ENTITY_TYPES.MASTER_OPTION,
    entityId: oldRecord.id as number,
    entityLabel: `${groupLabel}: ${newRecord.label ?? oldRecord.label}`,
    action: 'update',
    actor,
    changes
  })
}

export async function logMasterDelete(actor: Actor, option: Record<string, unknown>) {
  const groupLabel = MASTER_GROUP_LABELS[option.group as MasterGroup] ?? String(option.group)

  await recordActivity({
    entityType: ENTITY_TYPES.MASTER_OPTION,
    entityId: option.id as number,
    entityLabel: `${groupLabel}: ${option.label}`,
    action: 'delete',
    actor
  })
}

export function serializeActivityLog(log: {
  id: number
  entityType: string
  entityId: number | null
  entityLabel: string
  action: string
  summary: string
  changes: unknown
  actorId: number | null
  actorNama: string | null
  createdAt: Date
}): ActivityLogItem {
  return {
    id: log.id,
    entityType: log.entityType as EntityType,
    entityId: log.entityId,
    entityLabel: log.entityLabel,
    action: log.action as ActivityAction,
    summary: log.summary,
    changes: (log.changes as HistoryChange[] | null) ?? null,
    actorId: log.actorId,
    actorNama: log.actorNama,
    createdAt: log.createdAt.toISOString()
  }
}

export async function findActivityLogs(params: {
  entityType?: EntityType
  entityId?: number
  page?: number
  limit?: number
}) {
  const page = Math.max(params.page ?? 1, 1)
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 50)

  const where: Prisma.ActivityLogWhereInput = {
    ...(params.entityType && { entityType: params.entityType }),
    ...(params.entityId && { entityId: params.entityId })
  }

  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.activityLog.count({ where })
  ])

  return {
    items: items.map(serializeActivityLog),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}
