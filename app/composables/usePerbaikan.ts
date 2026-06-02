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

  async function uploadPerbaikanEvidence(barangId: number, perbaikanId: number, files: File[]) {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    return $fetch<{ success: boolean, data: PerbaikanItem['evidence'] }>(
      `/api/barang/${barangId}/perbaikan/${perbaikanId}/evidence`,
      { method: 'POST', body: formData }
    )
  }

  return { fetchPerbaikanList, createPerbaikan, uploadPerbaikanEvidence }
}
