import type { BarangInput, BarangItem } from '../../shared/types/barang'

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
    fetchUsers
  }
}
