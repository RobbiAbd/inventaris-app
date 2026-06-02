<script setup lang="ts">
import type { MasterGroup, MasterOptionInput } from '../../../shared/types/master'
import { MASTER_GROUP_LABELS } from '../../../shared/types/master'
import { FILTER_ALL, FILTER_NONE, fromOptionalKode, toOptionalKode } from '../../../shared/constants/filter'
import { DEFAULT_PAGE_SIZE } from '../../../shared/types/pagination'
import type { PaginationMeta } from '../../../shared/types/pagination'

definePageMeta({ layout: 'default', middleware: 'hrd' })

useSeoMeta({ title: 'Master Data - Inventaris App' })

const toast = useToast()
const {
  optionsFor,
  toSelectItems,
  createOption,
  updateOption,
  deleteOption,
  pending,
  refresh,
  MASTER_GROUPS
} = useMasterOptions(true)

const activeGroup = ref<MasterGroup>(MASTER_GROUPS.JENIS_VENDOR)
const showModal = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const search = ref('')
const statusFilter = ref(FILTER_ALL)
const page = ref(1)

const STATUS_ACTIVE = 'active'
const STATUS_INACTIVE = 'inactive'

const form = reactive({
  kode: '',
  label: '',
  sortOrder: 0,
  isActive: true,
  wajibAssignUser: false,
  wajibSewa: false,
  jenisVendorKode: FILTER_NONE,
  color: 'neutral' as 'success' | 'error' | 'warning' | 'neutral' | 'info'
})

const groupTabs = computed(() =>
  Object.values(MASTER_GROUPS).map(group => ({
    label: MASTER_GROUP_LABELS[group],
    value: group
  }))
)

const currentItems = computed(() => optionsFor(activeGroup.value, false))

const statusFilterItems = computed(() => [
  { label: 'Semua Status', value: FILTER_ALL },
  { label: 'Aktif', value: STATUS_ACTIVE },
  { label: 'Nonaktif', value: STATUS_INACTIVE }
])

const filteredItems = computed(() => {
  const query = search.value.trim().toLowerCase()
  return currentItems.value.filter((item) => {
    const matchesSearch = !query
      || item.label.toLowerCase().includes(query)
      || item.kode.toLowerCase().includes(query)
    const matchesStatus = statusFilter.value === FILTER_ALL
      || (statusFilter.value === STATUS_ACTIVE && item.isActive)
      || (statusFilter.value === STATUS_INACTIVE && !item.isActive)
    return matchesSearch && matchesStatus
  })
})

const pagination = computed<PaginationMeta>(() => {
  const total = filteredItems.value.length
  const totalPages = Math.max(Math.ceil(total / DEFAULT_PAGE_SIZE), 1)
  const currentPage = Math.min(page.value, totalPages)
  return {
    page: currentPage,
    limit: DEFAULT_PAGE_SIZE,
    total,
    totalPages
  }
})

const paginatedItems = computed(() => {
  const { page: currentPage, limit } = pagination.value
  const start = (currentPage - 1) * limit
  return filteredItems.value.slice(start, start + limit)
})

watch(activeGroup, () => {
  search.value = ''
  statusFilter.value = FILTER_ALL
  page.value = 1
})

function applyFilters() {
  page.value = 1
}

const jenisVendorItems = computed(() => [
  { label: 'Tidak dibatasi (semua vendor)', value: FILTER_NONE },
  ...toSelectItems(MASTER_GROUPS.JENIS_VENDOR)
])

function resetForm() {
  form.kode = ''
  form.label = ''
  form.sortOrder = currentItems.value.length
  form.isActive = true
  form.wajibAssignUser = false
  form.wajibSewa = false
  form.jenisVendorKode = FILTER_NONE
  form.color = 'neutral'
  editingId.value = null
}

function openCreate() {
  resetForm()
  showModal.value = true
}

function openEdit(item: typeof currentItems.value[number]) {
  editingId.value = item.id
  form.kode = item.kode
  form.label = item.label
  form.sortOrder = item.sortOrder
  form.isActive = item.isActive
  form.wajibAssignUser = Boolean(item.config?.wajibAssignUser)
  form.wajibSewa = Boolean(item.config?.wajibSewa)
  form.jenisVendorKode = fromOptionalKode(item.config?.jenisVendorKode as string | null | undefined)
  form.color = (item.config?.color as typeof form.color) ?? 'neutral'
  showModal.value = true
}

function buildConfig() {
  if (activeGroup.value === MASTER_GROUPS.KATEGORI_BARANG) {
    return {
      wajibAssignUser: form.wajibAssignUser,
      wajibSewa: form.wajibSewa,
      jenisVendorKode: toOptionalKode(form.jenisVendorKode)
    }
  }
  if (activeGroup.value === MASTER_GROUPS.STATUS_BARANG) {
    return { color: form.color }
  }
  return null
}

async function save() {
  saving.value = true
  try {
    const payload: MasterOptionInput = {
      group: activeGroup.value,
      kode: form.kode,
      label: form.label,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
      config: buildConfig()
    }

    if (editingId.value) {
      await updateOption(editingId.value, {
        label: payload.label,
        sortOrder: payload.sortOrder,
        isActive: payload.isActive,
        config: payload.config
      })
      toast.add({ title: 'Berhasil', description: 'Data diperbarui', color: 'success' })
    } else {
      await createOption(payload)
      toast.add({ title: 'Berhasil', description: 'Data ditambahkan', color: 'success' })
    }

    showModal.value = false
    await refresh()
  } catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string }, statusMessage?: string }
    toast.add({
      title: 'Gagal menyimpan',
      description: fetchError.data?.statusMessage ?? fetchError.statusMessage ?? 'Terjadi kesalahan',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function remove(id: number) {
  try {
    await deleteOption(id)
    toast.add({ title: 'Berhasil', description: 'Data dihapus', color: 'success' })
  } catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string }, statusMessage?: string }
    toast.add({
      title: 'Gagal menghapus',
      description: fetchError.data?.statusMessage ?? fetchError.statusMessage ?? 'Data mungkin masih digunakan',
      color: 'error'
    })
  }
}
</script>

<template>
  <AppDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Pengaturan Master Data">
        <template #right>
          <UButton icon="i-lucide-plus" label="Tambah" @click="openCreate" />
        </template>
      </UDashboardNavbar>
    </template>

    <div class="space-y-4">
      <UAlert
        icon="i-lucide-settings"
        color="info"
        variant="subtle"
        title="Semua pilihan form dinamis"
        description="Jenis vendor, kategori barang, status, dan tipe perolehan dikelola di sini. Perubahan langsung berlaku di seluruh aplikasi."
      />

      <UTabs v-model="activeGroup" :items="groupTabs" />

      <UCard :ui="{ root: 'overflow-visible relative z-10' }">
        <div class="grid gap-3 sm:grid-cols-3 mb-4">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Cari label atau kode..."
            @keyup.enter="applyFilters"
          />
          <AppFilterSelect v-model="statusFilter" :items="statusFilterItems" placeholder="Filter status" />
          <UButton label="Terapkan Filter" block @click="applyFilters" />
        </div>
      </UCard>

      <UCard :ui="{ body: 'p-0 sm:p-0' }">
        <div v-if="pending" class="p-8 text-center text-muted">Memuat...</div>
        <div v-else-if="filteredItems.length === 0" class="p-8 text-center text-muted">
          {{ currentItems.length === 0 ? 'Belum ada data. Klik Tambah untuk mengisi.' : 'Tidak ada data sesuai filter.' }}
        </div>
        <template v-else>
          <div class="divide-y divide-default">
            <div
              v-for="item in paginatedItems"
              :key="item.id"
              class="flex items-center justify-between gap-4 p-4"
            >
            <div>
              <div class="flex items-center gap-2">
                <p class="font-medium">{{ item.label }}</p>
                <UBadge variant="subtle" :label="item.kode" />
                <UBadge v-if="!item.isActive" color="neutral" variant="outline" label="Nonaktif" />
              </div>
              <p v-if="item.config" class="text-xs text-muted mt-1">
                Config: {{ JSON.stringify(item.config) }}
              </p>
            </div>
            <div class="flex gap-1">
              <UButton size="sm" variant="ghost" icon="i-lucide-pencil" @click="openEdit(item)" />
              <UButton size="sm" variant="ghost" color="error" icon="i-lucide-trash-2" @click="remove(item.id)" />
            </div>
            </div>
          </div>

          <AppTablePagination
            v-model:page="page"
            :pagination="pagination"
            label="opsi"
          />
        </template>
      </UCard>
    </div>

    <UModal
      v-model:open="showModal"
      :title="`${editingId ? 'Edit' : 'Tambah'} ${MASTER_GROUP_LABELS[activeGroup]}`"
      :ui="{ content: 'w-[calc(100vw-2rem)] max-w-2xl' }"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField label="Kode" required help="Huruf besar, angka, underscore. Contoh: GALON, LAPTOP">
            <UInput v-model="form.kode" :disabled="!!editingId" placeholder="GALON" />
          </UFormField>
          <UFormField label="Label" required>
            <UInput v-model="form.label" placeholder="Tampilan di form" />
          </UFormField>
          <UFormField label="Urutan">
            <UInput v-model.number="form.sortOrder" type="number" min="0" />
          </UFormField>
          <UFormField label="Status">
            <UCheckbox v-model="form.isActive" label="Aktif" />
          </UFormField>

          <template v-if="activeGroup === MASTER_GROUPS.KATEGORI_BARANG">
            <USeparator />
            <UCheckbox v-model="form.wajibAssignUser" label="Wajib ditugaskan ke karyawan" />
            <UCheckbox v-model="form.wajibSewa" label="Wajib dicatat sebagai sewa vendor" />
            <UFormField
              label="Batasi jenis vendor"
              help="Saat tambah/edit barang kategori ini, dropdown vendor hanya menampilkan vendor dengan jenis yang dipilih (plus jenis Lainnya). Contoh: kategori Galon → vendor Galon. Pilih opsi Tidak dibatasi jika semua vendor boleh dipakai."
            >
              <AppFilterSelect
                v-model="form.jenisVendorKode"
                :items="jenisVendorItems"
                placeholder="Pilih jenis vendor"
              />
            </UFormField>
          </template>

          <template v-if="activeGroup === MASTER_GROUPS.STATUS_BARANG">
            <USeparator />
            <UFormField label="Warna badge">
              <USelectMenu
                v-model="form.color"
                :items="[
                  { label: 'Hijau (success)', value: 'success' },
                  { label: 'Merah (error)', value: 'error' },
                  { label: 'Kuning (warning)', value: 'warning' },
                  { label: 'Biru (info)', value: 'info' },
                  { label: 'Abu (neutral)', value: 'neutral' }
                ]"
                value-key="value"
                class="w-full"
              />
            </UFormField>
          </template>
        </div>
      </template>

      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton label="Batal" color="neutral" variant="ghost" @click="showModal = false" />
          <UButton label="Simpan" :loading="saving" @click="save" />
        </div>
      </template>
    </UModal>
  </AppDashboardPanel>
</template>
