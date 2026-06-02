<script setup lang="ts">
import type { VendorInput } from '../../../../shared/types/vendor'

definePageMeta({ layout: 'default', middleware: 'hrd' })

const route = useRoute()
const { fetchVendor, updateVendor } = useVendor()
const toast = useToast()
const loading = ref(false)

const id = Number(route.params.id)

useSeoMeta({ title: 'Edit Vendor - Inventaris App' })

const { data, error } = await useAuthenticatedAsyncData(
  () => `vendor-edit-${id}`,
  () => fetchVendor(id)
)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Vendor tidak ditemukan' })
}

const vendor = computed(() => data.value?.data)

async function onSubmit(formData: VendorInput) {
  loading.value = true
  try {
    await updateVendor(id, formData)
    toast.add({ title: 'Berhasil', description: 'Vendor diperbarui', color: 'success' })
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
  <AppDashboardPanel v-if="vendor">
    <template #header>
      <UDashboardNavbar title="Edit Vendor">
        <template #leading>
          <UButton to="/vendor" icon="i-lucide-arrow-left" color="neutral" variant="ghost" />
        </template>
      </UDashboardNavbar>
    </template>

    <VendorForm :initial-data="vendor" :loading="loading" @submit="onSubmit" />
  </AppDashboardPanel>
</template>
