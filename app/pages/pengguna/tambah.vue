<script setup lang="ts">
import type { UserFormData, UserInput, UserUpdateInput } from '../../../shared/types/user'

definePageMeta({ layout: 'default', middleware: 'hrd' })

const { createUser } = useUsers()
const toast = useToast()
const loading = ref(false)

useSeoMeta({ title: 'Tambah Pengguna - Inventaris App' })

async function onSubmit(data: UserFormData) {
  if (!data.password) {
    toast.add({ title: 'Validasi gagal', description: 'Password wajib diisi', color: 'error' })
    return
  }

  loading.value = true
  try {
    await createUser({ ...data, password: data.password })
    toast.add({ title: 'Berhasil', description: 'Pengguna berhasil ditambahkan', color: 'success' })
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
      <UDashboardNavbar title="Tambah Pengguna">
        <template #leading>
          <UButton to="/pengguna" icon="i-lucide-arrow-left" color="neutral" variant="ghost" />
        </template>
      </UDashboardNavbar>
    </template>

    <UserForm :loading="loading" @submit="onSubmit" />
  </AppDashboardPanel>
</template>
