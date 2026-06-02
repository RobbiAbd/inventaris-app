import type { DashboardStats } from '../../shared/types/dashboard'

interface DashboardStatsResponse {
  success: boolean
  message: string
  data: DashboardStats
}

export function useDashboard() {
  async function fetchDashboardStats() {
    return $fetch<DashboardStatsResponse>('/api/dashboard/stats')
  }

  return { fetchDashboardStats }
}
