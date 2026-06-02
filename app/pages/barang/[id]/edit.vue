<script setup lang="ts">
import type { BarangSubmitPayload } from '../../../../shared/types/barang'

definePageMeta({
  layout: 'default',
  middleware: 'hrd'
})

const route = useRoute()
const { fetchBarang, updateBarang, syncBarangEvidence } = useBarang()
const toast = useToast()
const loading = ref(false)

const id = Number(route.params.id)

useSeoMeta({ title: 'Edit Barang - Inventaris App' })

const { data, error } = await useAuthenticatedAsyncData(
  () => `barang-edit-${id}`,
  () => fetchBarang(id)
)

if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Barang tidak ditemukan'
  })
}

const barang = computed(() => data.value?.data)

async function onSubmit(payload: BarangSubmitPayload) {
  loading.value = true

  try {
    await updateBarang(id, payload.data)
    await syncBarangEvidence(id, payload)
    toast.add({
      title: 'Berhasil',
      description: 'Data barang berhasil diperbarui',
      color: 'success'
    })
    await navigateTo(`/barang/${id}`)
  } catch (error: unknown) {
    const fetchError = error as {
      data?: { statusMessage?: string }
      statusMessage?: string
    }

    toast.add({
      title: 'Gagal memperbarui',
      description: fetchError.data?.statusMessage ?? fetchError.statusMessage ?? 'Terjadi kesalahan',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppDashboardPanel v-if="barang">
    <template #header>
      <UDashboardNavbar title="Edit Barang">
        <template #leading>
          <UButton
            :to="`/barang/${id}`"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <BarangForm
      :initial-data="barang"
      :loading="loading"
      @submit="onSubmit"
    />
  </AppDashboardPanel>
</template>
