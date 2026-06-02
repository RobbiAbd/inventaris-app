<script setup lang="ts">
import { FILTER_ALL, toFilterValue } from '../../../shared/constants/filter'
import { DEFAULT_PAGE_SIZE } from '../../../shared/types/pagination'

definePageMeta({ layout: 'default', middleware: 'hrd' })

const { user } = useAuth()
const { fetchVendorList, deleteVendor } = useVendor()
const { toSelectItems, labelFor, MASTER_GROUPS } = useMasterOptions()
const toast = useToast()

const isHrd = computed(() => user.value?.role === 'HRD')
const showDeleteModal = ref(false)
const deleting = ref(false)
const vendorToDelete = ref<{ id: number, nama: string } | null>(null)

const page = ref(1)
const search = ref('')
const jenis = ref(FILTER_ALL)

useSeoMeta({ title: 'Vendor - Inventaris App' })

const { data, pending, refresh } = await useAuthenticatedAsyncData(
  'vendor-list',
  () => fetchVendorList({
    page: page.value,
    limit: DEFAULT_PAGE_SIZE,
    search: search.value || undefined,
    jenis: toFilterValue(jenis.value)
  }),
  { watch: [page] }
)

const vendors = computed(() => data.value?.data.items ?? [])
const pagination = computed(() => data.value?.data.pagination)

const jenisFilterItems = computed(() => [
  { label: 'Semua Jenis', value: FILTER_ALL },
  ...toSelectItems(MASTER_GROUPS.JENIS_VENDOR)
])

function applyFilters() {
  page.value = 1
  refresh()
}

const exportFilters = computed(() => ({
  search: search.value || undefined,
  jenis: toFilterValue(jenis.value)
}))

function openDelete(vendor: { id: number, nama: string }) {
  vendorToDelete.value = vendor
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!vendorToDelete.value) return
  deleting.value = true
  try {
    await deleteVendor(vendorToDelete.value.id)
    toast.add({ title: 'Berhasil', description: 'Vendor dihapus', color: 'success' })
    await refresh()
  } catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string }, statusMessage?: string }
    toast.add({
      title: 'Gagal menghapus',
      description: fetchError.data?.statusMessage ?? fetchError.statusMessage ?? 'Terjadi kesalahan',
      color: 'error'
    })
  } finally {
    deleting.value = false
    showDeleteModal.value = false
    vendorToDelete.value = null
  }
}
</script>

<template>
  <AppDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Vendor">
        <template #right>
          <div class="flex items-center gap-2">
            <AppReportDownload report-type="vendor" :filters="exportFilters" />
            <UButton v-if="isHrd" to="/vendor/tambah" icon="i-lucide-plus" label="Tambah Vendor" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <div class="space-y-4">
      <UAlert
        icon="i-lucide-info"
        color="info"
        variant="subtle"
        title="Vendor untuk barang sewa"
        description="Jenis vendor dikelola dinamis di Pengaturan Master Data."
      />

      <UCard :ui="{ root: 'overflow-visible relative z-10' }">
        <div class="grid gap-3 sm:grid-cols-3">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Cari nama, kontak, telepon..."
            @keyup.enter="applyFilters"
          />
          <AppFilterSelect v-model="jenis" :items="jenisFilterItems" placeholder="Filter jenis vendor" />
          <UButton label="Terapkan Filter" block @click="applyFilters" />
        </div>
      </UCard>

      <UCard :ui="{ body: 'p-0 sm:p-0' }">
        <div v-if="pending" class="p-8 text-center text-muted">Memuat data...</div>
        <div v-else-if="vendors.length === 0" class="p-8 text-center">
          <UIcon name="i-lucide-building-2" class="size-10 text-muted mx-auto mb-2" />
          <p class="text-muted">Belum ada vendor tercatat</p>
          <UButton v-if="isHrd" to="/vendor/tambah" class="mt-4" label="Tambah Vendor" />
        </div>

        <template v-else>
          <div class="divide-y divide-default">
            <div v-for="vendor in vendors" :key="vendor.id" class="flex items-center justify-between gap-4 p-4">
              <div>
                <p class="font-medium">{{ vendor.nama }}</p>
                <div class="flex flex-wrap gap-2 mt-1">
                  <UBadge variant="subtle" :label="labelFor(MASTER_GROUPS.JENIS_VENDOR, vendor.jenis)" />
                  <span v-if="vendor.telepon" class="text-xs text-muted">{{ vendor.telepon }}</span>
                  <span class="text-xs text-muted">{{ vendor._count?.barang ?? 0 }} barang terhubung</span>
                </div>
              </div>
              <div v-if="isHrd" class="flex gap-1">
                <UButton :to="`/vendor/${vendor.id}/edit`" size="sm" color="neutral" variant="ghost" icon="i-lucide-pencil" />
                <UButton size="sm" color="error" variant="ghost" icon="i-lucide-trash-2" @click="openDelete({ id: vendor.id, nama: vendor.nama })" />
              </div>
            </div>
          </div>

          <AppTablePagination
            v-if="pagination"
            v-model:page="page"
            :pagination="pagination"
            label="vendor"
          />
        </template>
      </UCard>
    </div>

    <UModal v-model:open="showDeleteModal" title="Hapus Vendor" :ui="{ content: 'w-[calc(100vw-2rem)] max-w-lg' }">
      <template #body>
        <p class="text-muted">Yakin ingin menghapus vendor <strong>{{ vendorToDelete?.nama }}</strong>?</p>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton label="Batal" color="neutral" variant="ghost" @click="showDeleteModal = false" />
          <UButton label="Hapus" color="error" :loading="deleting" @click="confirmDelete" />
        </div>
      </template>
    </UModal>
  </AppDashboardPanel>
</template>
