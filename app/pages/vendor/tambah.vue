<script setup lang="ts">
import type { VendorInput } from '../../../shared/types/vendor'

definePageMeta({ layout: 'default', middleware: 'hrd' })

const { createVendor } = useVendor()
const toast = useToast()
const loading = ref(false)

useSeoMeta({ title: 'Tambah Vendor - Inventaris App' })

async function onSubmit(data: VendorInput) {
  loading.value = true
  try {
    await createVendor(data)
    toast.add({ title: 'Berhasil', description: 'Vendor berhasil ditambahkan', color: 'success' })
    await navigateTo('/vendor')
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
      <UDashboardNavbar title="Tambah Vendor">
        <template #leading>
          <UButton to="/vendor" icon="i-lucide-arrow-left" color="neutral" variant="ghost" />
        </template>
      </UDashboardNavbar>
    </template>

    <VendorForm :loading="loading" @submit="onSubmit" />
  </AppDashboardPanel>
</template>
