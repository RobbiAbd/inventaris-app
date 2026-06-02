import type { ActivityLogItem, EntityType } from '../../shared/types/history'

interface HistoryListResponse {
  success: boolean
  message: string
  data: {
    items: ActivityLogItem[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export function useHistory() {
  async function fetchHistory(params: {
    entityType?: EntityType
    entityId?: number
    page?: number
    limit?: number
  } = {}) {
    return $fetch<HistoryListResponse>('/api/history', { query: params })
  }

  return { fetchHistory }
}
