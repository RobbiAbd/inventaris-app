export const REPORT_TYPES = {
  BARANG: 'barang',
  VENDOR: 'vendor',
  PENGGUNA: 'pengguna',
  RIWAYAT: 'riwayat'
} as const

export type ReportType = typeof REPORT_TYPES[keyof typeof REPORT_TYPES]

export const REPORT_FORMATS = ['xlsx', 'pdf'] as const
export type ReportFormat = typeof REPORT_FORMATS[number]

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  barang: 'Laporan Barang',
  vendor: 'Laporan Vendor',
  pengguna: 'Laporan Pengguna',
  riwayat: 'Laporan Riwayat Aktivitas'
}

export interface ReportTable {
  title: string
  sheetName: string
  headers: string[]
  rows: string[][]
}

export interface ReportFilters {
  search?: string
  kategori?: string
  status?: string
  jenis?: string
  role?: string
  entityType?: string
}
