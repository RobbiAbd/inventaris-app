import type { BarangInput, BarangItem, BarangSubmitPayload } from '../../shared/types/barang'

interface BarangListResponse {
  success: boolean
  message: string
  data: {
    items: BarangItem[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

interface BarangDetailResponse {
  success: boolean
  message: string
  data: BarangItem
}

export function useBarang() {
  async function fetchBarangList(params: {
    page?: number
    limit?: number
    search?: string
    kategori?: string
    status?: string
  } = {}) {
    return $fetch<BarangListResponse>('/api/barang', { query: params })
  }

  async function fetchBarang(id: number) {
    return $fetch<BarangDetailResponse>(`/api/barang/${id}`)
  }

  async function createBarang(data: BarangInput) {
    return $fetch<BarangDetailResponse>('/api/barang', {
      method: 'POST',
      body: data
    })
  }

  async function updateBarang(id: number, data: BarangInput) {
    return $fetch<BarangDetailResponse>(`/api/barang/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  async function deleteBarang(id: number) {
    return $fetch('/api/barang/' + id, { method: 'DELETE' })
  }

  async function uploadBarangEvidence(barangId: number, files: File[]) {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    return $fetch<{ success: boolean, data: BarangItem['evidence'] }>(
      `/api/barang/${barangId}/evidence`,
      { method: 'POST', body: formData }
    )
  }

  async function deleteBarangEvidence(barangId: number, evidenceId: number) {
    return $fetch(`/api/barang/${barangId}/evidence/${evidenceId}`, { method: 'DELETE' })
  }

  async function syncBarangEvidence(
    barangId: number,
    payload: Pick<BarangSubmitPayload, 'newEvidenceFiles' | 'removeEvidenceIds'>
  ) {
    for (const evidenceId of payload.removeEvidenceIds ?? []) {
      await deleteBarangEvidence(barangId, evidenceId)
    }

    if (payload.newEvidenceFiles?.length) {
      await uploadBarangEvidence(barangId, payload.newEvidenceFiles)
    }
  }

  async function fetchUsers() {
    return $fetch<{
      success: boolean
      data: {
        items: Array<{ id: number, nama: string, email: string, role: string }>
      }
    }>('/api/users', { query: { all: 'true' } })
  }

  return {
    fetchBarangList,
    fetchBarang,
    createBarang,
    updateBarang,
    deleteBarang,
    uploadBarangEvidence,
    deleteBarangEvidence,
    syncBarangEvidence,
    fetchUsers
  }
}
