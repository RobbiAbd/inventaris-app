<script setup lang="ts">
import type { BarangInput } from '../../../shared/types/barang'

definePageMeta({
  layout: 'default',
  middleware: 'hrd'
})

const { createBarang } = useBarang()
const toast = useToast()
const loading = ref(false)

useSeoMeta({ title: 'Tambah Barang - Inventaris App' })

async function onSubmit(data: BarangInput) {
  loading.value = true

  try {
    await createBarang(data)
    toast.add({
      title: 'Berhasil',
      description: 'Barang baru berhasil ditambahkan',
      color: 'success'
    })
    await navigateTo('/barang')
  } catch (error: unknown) {
    const fetchError = error as {
      data?: { statusMessage?: string }
      statusMessage?: string
    }

    toast.add({
      title: 'Gagal menambah barang',
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
      <UDashboardNavbar title="Tambah Barang">
        <template #leading>
          <UButton
            to="/barang"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <BarangForm :loading="loading" @submit="onSubmit" />
  </AppDashboardPanel>
</template>
