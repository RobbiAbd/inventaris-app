import type { UserInput, UserItem, UserUpdateInput } from '../../shared/types/user'

interface UserListResponse {
  success: boolean
  message: string
  data: UserItem[]
}

interface UserDetailResponse {
  success: boolean
  message: string
  data: UserItem
}

export function useUsers() {
  async function fetchUserList(params: { search?: string } = {}) {
    return $fetch<UserListResponse>('/api/users', { query: params })
  }

  async function fetchUser(id: number) {
    return $fetch<UserDetailResponse>(`/api/users/${id}`)
  }

  async function createUser(data: UserInput) {
    return $fetch<UserDetailResponse>('/api/users', {
      method: 'POST',
      body: data
    })
  }

  async function updateUser(id: number, data: UserUpdateInput) {
    return $fetch<UserDetailResponse>(`/api/users/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  async function deleteUser(id: number) {
    return $fetch(`/api/users/${id}`, { method: 'DELETE' })
  }

  return {
    fetchUserList,
    fetchUser,
    createUser,
    updateUser,
    deleteUser
  }
}
