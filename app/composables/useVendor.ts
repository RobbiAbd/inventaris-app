import type { VendorInput, VendorItem } from '../../shared/types/vendor'

interface VendorListResponse {
  success: boolean
  message: string
  data: VendorItem[]
}

interface VendorDetailResponse {
  success: boolean
  message: string
  data: VendorItem
}

export function useVendor() {
  async function fetchVendorList(params: {
    jenis?: string
    search?: string
  } = {}) {
    return $fetch<VendorListResponse>('/api/vendor', { query: params })
  }

  async function fetchVendor(id: number) {
    return $fetch<VendorDetailResponse>(`/api/vendor/${id}`)
  }

  async function createVendor(data: VendorInput) {
    return $fetch<VendorDetailResponse>('/api/vendor', {
      method: 'POST',
      body: data
    })
  }

  async function updateVendor(id: number, data: VendorInput) {
    return $fetch<VendorDetailResponse>(`/api/vendor/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  async function deleteVendor(id: number) {
    return $fetch(`/api/vendor/${id}`, { method: 'DELETE' })
  }

  return {
    fetchVendorList,
    fetchVendor,
    createVendor,
    updateVendor,
    deleteVendor
  }
}
