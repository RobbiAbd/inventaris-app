import type { ProfileItem, ProfileUpdateInput } from '../../shared/types/profile'

export function useProfile() {
  async function updateProfile(data: ProfileUpdateInput) {
    return $fetch<{ success: boolean, data: { user: ProfileItem } }>(
      '/api/auth/profile',
      { method: 'PUT', body: data }
    )
  }

  return { updateProfile }
}
