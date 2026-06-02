import type { PerbaikanInput, PerbaikanItem } from '../../shared/types/perbaikan'

export function usePerbaikan() {
  async function fetchPerbaikanList(barangId: number) {
    return $fetch<{ success: boolean, data: PerbaikanItem[] }>(
      `/api/barang/${barangId}/perbaikan`
    )
  }

  async function createPerbaikan(barangId: number, data: PerbaikanInput) {
    return $fetch<{ success: boolean, data: PerbaikanItem }>(
      `/api/barang/${barangId}/perbaikan`,
      { method: 'POST', body: data }
    )
  }

  return { fetchPerbaikanList, createPerbaikan }
}
