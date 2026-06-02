import type {
  CreatePengajuanInput,
  PengajuanItem,
  ReviewPengajuanInput
} from '../../shared/types/pengajuan'
import type { PaginatedResult } from '../../shared/types/pagination'

export function usePengajuanApi() {
  async function fetchPengajuanList(params: {
    page?: number
    limit?: number
    status?: string
    mine?: boolean
  } = {}) {
    return $fetch<{
      success: boolean
      data: PaginatedResult<PengajuanItem>
    }>('/api/pengajuan', {
      query: {
        ...params,
        ...(params.mine && { mine: 'true' })
      }
    })
  }

  async function createPengajuan(data: CreatePengajuanInput) {
    return $fetch<{ success: boolean, data: PengajuanItem }>(
      '/api/pengajuan',
      { method: 'POST', body: data }
    )
  }

  async function reviewPengajuan(id: number, data: ReviewPengajuanInput) {
    return $fetch<{ success: boolean, data: PengajuanItem }>(
      `/api/pengajuan/${id}/review`,
      { method: 'POST', body: data }
    )
  }

  return { fetchPengajuanList, createPengajuan, reviewPengajuan }
}
