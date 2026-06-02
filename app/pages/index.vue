<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { user } = useAuth()
const { fetchBarangList } = useBarang()
const { fetchDashboardStats } = useDashboard()

useSeoMeta({
  title: 'Dashboard - Inventaris App'
})

const isHrd = computed(() => user.value?.role === 'HRD')

const { data: barangResponse, pending } = await useAuthenticatedAsyncData(
  'dashboard-barang',
  () => fetchBarangList({ limit: 50 })
)

const { data: hrdStatsResponse, pending: hrdPending } = await useAuthenticatedAsyncData(
  'dashboard-hrd-stats',
  async () => {
    if (user.value?.role !== 'HRD') {
      return null
    }
    const response = await fetchDashboardStats()
    return response.data
  },
  { watch: [() => user.value?.role] }
)

const items = computed(() => barangResponse.value?.data.items ?? [])

const stats = computed(() => ({
  total: barangResponse.value?.data.pagination.total ?? items.value.length,
  baik: items.value.filter(i => i.status === 'BAIK').length,
  rusak: items.value.filter(i => i.status === 'RUSAK').length,
  perbaikan: items.value.filter(i => i.status === 'DALAM_PERBAIKAN').length
}))
</script>

<template>
  <AppDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Dashboard" />
    </template>

    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold">Dashboard</h1>
        <p class="text-muted mt-1">
          Selamat datang, {{ user?.nama }}!
        </p>
      </div>

      <template v-if="isHrd">
        <div v-if="hrdPending" class="py-12 text-center text-muted">
          Memuat statistik...
        </div>
        <AppHrdDashboardCharts v-else-if="hrdStatsResponse" :stats="hrdStatsResponse" />
      </template>

      <template v-else>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UCard>
            <div class="flex items-center gap-4">
              <UIcon name="i-lucide-package" class="size-8 text-primary" />
              <div>
                <p class="text-sm text-muted">Barang Saya</p>
                <p class="text-2xl font-bold">{{ pending ? '...' : stats.total }}</p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center gap-4">
              <UIcon name="i-lucide-circle-check" class="size-8 text-success" />
              <div>
                <p class="text-sm text-muted">Kondisi Baik</p>
                <p class="text-2xl font-bold">{{ pending ? '...' : stats.baik }}</p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center gap-4">
              <UIcon name="i-lucide-circle-x" class="size-8 text-error" />
              <div>
                <p class="text-sm text-muted">Rusak</p>
                <p class="text-2xl font-bold">{{ pending ? '...' : stats.rusak }}</p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center gap-4">
              <UIcon name="i-lucide-wrench" class="size-8 text-warning" />
              <div>
                <p class="text-sm text-muted">Dalam Perbaikan</p>
                <p class="text-2xl font-bold">{{ pending ? '...' : stats.perbaikan }}</p>
              </div>
            </div>
          </UCard>
        </div>
      </template>

      <UCard>
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="font-semibold">Kelola Inventaris</h2>
            <p class="text-sm text-muted mt-1">
              {{ isHrd ? 'Ringkasan dan grafik seluruh inventaris perusahaan' : 'Lihat barang yang ditugaskan ke Anda' }}
            </p>
          </div>
          <UButton
            to="/barang"
            label="Lihat Barang"
            trailing-icon="i-lucide-arrow-right"
          />
        </div>
      </UCard>
    </div>
  </AppDashboardPanel>
</template>
