<script setup lang="ts">
import { FILTER_ALL, toFilterValue } from '../../../shared/constants/filter'
import { DEFAULT_PAGE_SIZE } from '../../../shared/types/pagination'
import { formatRupiah } from '../../../shared/utils/currency'

definePageMeta({ layout: 'default' })

const { user } = useAuth()
const { fetchBarangList } = useBarang()
const { toSelectItems, labelFor, statusColor, MASTER_GROUPS } = useMasterOptions()
const route = useRoute()
const router = useRouter()

useSeoMeta({ title: 'Daftar Barang - Inventaris App' })

const isHrd = computed(() => user.value?.role === 'HRD')

const page = ref(Number(route.query.page) || 1)
const search = ref((route.query.search as string) || '')
const kategori = ref((route.query.kategori as string) || FILTER_ALL)
const status = ref((route.query.status as string) || FILTER_ALL)

const { data, pending, refresh } = await useAuthenticatedAsyncData(
  'barang-list',
  () => fetchBarangList({
    page: page.value,
    limit: DEFAULT_PAGE_SIZE,
    search: search.value || undefined,
    kategori: toFilterValue(kategori.value),
    status: toFilterValue(status.value)
  }),
  { watch: [page] }
)

const items = computed(() => data.value?.data.items ?? [])
const pagination = computed(() => data.value?.data.pagination)

const kategoriFilterItems = computed(() => [
  { label: 'Semua Kategori', value: FILTER_ALL },
  ...toSelectItems(MASTER_GROUPS.KATEGORI_BARANG)
])

const statusFilterItems = computed(() => [
  { label: 'Semua Status', value: FILTER_ALL },
  ...toSelectItems(MASTER_GROUPS.STATUS_BARANG)
])

function applyFilters() {
  page.value = 1
  router.replace({
    query: {
      ...(search.value && { search: search.value }),
      ...(kategori.value !== FILTER_ALL && { kategori: kategori.value }),
      ...(status.value !== FILTER_ALL && { status: status.value })
    }
  })
  refresh()
}

const exportFilters = computed(() => ({
  search: search.value || undefined,
  kategori: toFilterValue(kategori.value),
  status: toFilterValue(status.value)
}))

const columns = [
  { accessorKey: 'nama', header: 'Nama' },
  { accessorKey: 'kategori', header: 'Kategori' },
  { accessorKey: 'quantity', header: 'Qty' },
  { accessorKey: 'harga', header: 'Harga' },
  { accessorKey: 'tipePerolehan', header: 'Perolehan' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'vendor', header: 'Vendor' },
  { accessorKey: 'user', header: 'Ditugaskan ke' },
  { id: 'actions', header: '' }
]
</script>

<template>
  <AppDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Daftar Barang">
        <template #right>
          <div class="flex items-center gap-2">
            <AppReportDownload report-type="barang" :filters="exportFilters" />
            <UButton v-if="isHrd" to="/barang/tambah" icon="i-lucide-plus" label="Tambah Barang" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <div class="space-y-4">
      <UCard :ui="{ root: 'overflow-visible relative z-10' }">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <UInput v-model="search" icon="i-lucide-search" placeholder="Cari barang..." @keyup.enter="applyFilters" />
          <AppFilterSelect v-model="kategori" :items="kategoriFilterItems" placeholder="Filter kategori" />
          <AppFilterSelect v-model="status" :items="statusFilterItems" placeholder="Filter status" />
          <UButton label="Terapkan Filter" block @click="applyFilters" />
        </div>
      </UCard>

      <UCard :ui="{ body: 'p-0 sm:p-0' }">
        <div v-if="pending" class="p-8 text-center text-muted">Memuat data...</div>
        <div v-else-if="items.length === 0" class="p-8 text-center">
          <UIcon name="i-lucide-package-open" class="size-10 text-muted mx-auto mb-2" />
          <p class="text-muted">{{ isHrd ? 'Belum ada barang tercatat' : 'Belum ada barang ditugaskan ke Anda' }}</p>
          <UButton v-if="isHrd" to="/barang/tambah" class="mt-4" label="Tambah Barang Pertama" />
        </div>

        <template v-else>
          <UTable :data="items" :columns="columns" class="w-full">
            <template #kategori-cell="{ row }">
              {{ labelFor(MASTER_GROUPS.KATEGORI_BARANG, row.original.kategori) }}
            </template>

            <template #quantity-cell="{ row }">
              {{ row.original.quantity }}
            </template>

            <template #harga-cell="{ row }">
              <span :class="{ 'text-muted': !row.original.harga }">
                {{ formatRupiah(row.original.harga) }}
              </span>
            </template>

            <template #tipePerolehan-cell="{ row }">
              <UBadge
                :color="row.original.tipePerolehan === 'SEWA' ? 'info' : 'neutral'"
                variant="subtle"
                :label="labelFor(MASTER_GROUPS.TIPE_PEROLEHAN, row.original.tipePerolehan)"
              />
            </template>

            <template #status-cell="{ row }">
              <UBadge
                :color="statusColor(row.original.status)"
                variant="subtle"
                :label="labelFor(MASTER_GROUPS.STATUS_BARANG, row.original.status)"
              />
            </template>

            <template #vendor-cell="{ row }">
              <span v-if="row.original.vendor">{{ row.original.vendor.nama }}</span>
              <span v-else class="text-muted">-</span>
            </template>

            <template #user-cell="{ row }">
              <span v-if="row.original.user">{{ row.original.user.nama }}</span>
              <UBadge v-else color="neutral" variant="subtle" label="Belum ditugaskan" />
            </template>

            <template #actions-cell="{ row }">
              <div class="flex gap-1">
                <UButton
                  :to="`/barang/${row.original.id}`"
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-eye"
                  label="Detail"
                />
                <UButton
                  v-if="isHrd"
                  :to="`/barang/${row.original.id}/edit`"
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-pencil"
                  label="Edit"
                />
              </div>
            </template>
          </UTable>

          <AppTablePagination
            v-if="pagination"
            v-model:page="page"
            :pagination="pagination"
            label="barang"
          />
        </template>
      </UCard>
    </div>
  </AppDashboardPanel>
</template>
