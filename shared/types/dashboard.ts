export interface DashboardChartItem {
  kode: string
  count: number
}

export interface DashboardRoleItem {
  role: string
  count: number
}

export interface DashboardStats {
  totals: {
    barang: number
    vendor: number
    users: number
    barangAssigned: number
    barangUnassigned: number
  }
  barangByStatus: DashboardChartItem[]
  barangByKategori: DashboardChartItem[]
  barangByTipePerolehan: DashboardChartItem[]
  vendorByJenis: DashboardChartItem[]
  usersByRole: DashboardRoleItem[]
}
