<script setup lang="ts">
import type { UserFormData, UserUpdateInput } from '../../../../shared/types/user'

definePageMeta({ layout: 'default', middleware: 'hrd' })

const route = useRoute()
const id = Number(route.params.id)

const { fetchUser, updateUser } = useUsers()
const toast = useToast()
const loading = ref(false)

useSeoMeta({ title: 'Edit Pengguna - Inventaris App' })

const { data, error } = await useAuthenticatedAsyncData(
  () => `user-${id}`,
  () => fetchUser(id)
)

if (error.value || !data.value?.data) {
  throw createError({ statusCode: 404, statusMessage: 'Pengguna tidak ditemukan' })
}

const user = computed(() => data.value!.data)

async function onSubmit(formData: UserFormData) {
  loading.value = true
  try {
    await updateUser(id, formData as UserUpdateInput)
    toast.add({ title: 'Berhasil', description: 'Pengguna berhasil diperbarui', color: 'success' })
    await navigateTo('/pengguna')
  } catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string }, statusMessage?: string }
    toast.add({
      title: 'Gagal',
      description: fetchError.data?.statusMessage ?? fetchError.statusMessage ?? 'Terjadi kesalahan',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="`Edit — ${user.nama}`">
        <template #leading>
          <UButton to="/pengguna" icon="i-lucide-arrow-left" color="neutral" variant="ghost" />
        </template>
      </UDashboardNavbar>
    </template>

    <UserForm :initial-data="user" :loading="loading" @submit="onSubmit" />
  </AppDashboardPanel>
</template>
