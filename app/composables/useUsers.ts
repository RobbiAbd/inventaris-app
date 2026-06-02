import type { UserInput, UserItem, UserUpdateInput } from '../../shared/types/user'
import type { PaginatedResult } from '../../shared/types/pagination'

interface UserListResponse {
  success: boolean
  message: string
  data: PaginatedResult<UserItem>
}

interface UserDetailResponse {
  success: boolean
  message: string
  data: UserItem
}

export function useUsers() {
  async function fetchUserList(params: {
    page?: number
    limit?: number
    search?: string
    role?: string
    all?: boolean
  } = {}) {
    return $fetch<UserListResponse>('/api/users', {
      query: {
        ...params,
        ...(params.all && { all: 'true' })
      }
    })
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
