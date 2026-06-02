import { z } from 'zod'

export const MASTER_GROUPS = {
  JENIS_VENDOR: 'jenis_vendor',
  KATEGORI_BARANG: 'kategori_barang',
  STATUS_BARANG: 'status_barang',
  TIPE_PEROLEHAN: 'tipe_perolehan'
} as const

export type MasterGroup = typeof MASTER_GROUPS[keyof typeof MASTER_GROUPS]

export const MASTER_GROUP_LABELS: Record<MasterGroup, string> = {
  jenis_vendor: 'Jenis Vendor',
  kategori_barang: 'Kategori Barang',
  status_barang: 'Status Barang',
  tipe_perolehan: 'Tipe Perolehan'
}

export interface KategoriBarangConfig {
  wajibAssignUser?: boolean
  wajibSewa?: boolean
  jenisVendorKode?: string | null
}

export interface StatusBarangConfig {
  color?: 'success' | 'error' | 'warning' | 'neutral' | 'info'
}

export interface MasterOptionItem {
  id: number
  group: MasterGroup
  kode: string
  label: string
  config: Record<string, unknown> | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type MasterOptionsMap = Record<MasterGroup, MasterOptionItem[]>

export const masterOptionSchema = z.object({
  group: z.enum([
    MASTER_GROUPS.JENIS_VENDOR,
    MASTER_GROUPS.KATEGORI_BARANG,
    MASTER_GROUPS.STATUS_BARANG,
    MASTER_GROUPS.TIPE_PEROLEHAN
  ]),
  kode: z.string()
    .min(1, 'Kode wajib diisi')
    .max(50, 'Kode maksimal 50 karakter')
    .regex(/^[A-Z0-9_]+$/, 'Kode hanya huruf besar, angka, dan underscore'),
  label: z.string().min(1, 'Label wajib diisi').max(100),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional().nullable()
})

export type MasterOptionInput = z.infer<typeof masterOptionSchema>

export function getMasterLabel(
  options: MasterOptionItem[],
  kode: string,
  fallback = kode
) {
  return options.find(o => o.kode === kode && o.isActive)?.label ?? fallback
}

export function getKategoriConfig(option?: MasterOptionItem | null): KategoriBarangConfig {
  if (!option?.config) return {}
  return option.config as KategoriBarangConfig
}

export function getStatusColor(option?: MasterOptionItem | null) {
  const config = (option?.config ?? {}) as StatusBarangConfig
  return config.color ?? 'neutral'
}
