export const ENTITY_TYPES = {
  BARANG: 'barang',
  VENDOR: 'vendor',
  USER: 'user',
  MASTER_OPTION: 'master_option'
} as const

export type EntityType = typeof ENTITY_TYPES[keyof typeof ENTITY_TYPES]

export const ACTIVITY_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete'
} as const

export type ActivityAction = typeof ACTIVITY_ACTIONS[keyof typeof ACTIVITY_ACTIONS]

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  barang: 'Barang',
  vendor: 'Vendor',
  user: 'Pengguna',
  master_option: 'Master Data'
}

export const ACTION_LABELS: Record<ActivityAction, string> = {
  create: 'Ditambahkan',
  update: 'Diperbarui',
  delete: 'Dihapus'
}

export interface HistoryChange {
  field: string
  label: string
  oldValue: string | null
  newValue: string | null
}

export interface ActivityLogItem {
  id: number
  entityType: EntityType
  entityId: number | null
  entityLabel: string
  action: ActivityAction
  summary: string
  changes: HistoryChange[] | null
  actorId: number | null
  actorNama: string | null
  createdAt: string
}
