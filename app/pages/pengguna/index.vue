<script setup lang="ts">
import { roleLabels } from '../../../shared/types/user'
import type { UserRole } from '../../../shared/types/user'
import { FILTER_ALL, toFilterValue } from '../../../shared/constants/filter'
import { DEFAULT_PAGE_SIZE } from '../../../shared/types/pagination'

definePageMeta({ layout: 'default', middleware: 'hrd' })

const { fetchUserList, deleteUser } = useUsers()
const { user: currentUser } = useAuth()
const toast = useToast()

useSeoMeta({ title: 'Pengguna - Inventaris App' })

const page = ref(1)
const search = ref('')
const role = ref(FILTER_ALL)
const showDeleteModal = ref(false)
const deleting = ref(false)
const userToDelete = ref<{ id: number, nama: string, barangCount: number } | null>(null)

const { data, pending, refresh } = await useAuthenticatedAsyncData(
  'user-list',
  () => fetchUserList({
    page: page.value,
    limit: DEFAULT_PAGE_SIZE,
    search: search.value || undefined,
    role: toFilterValue(role.value)
  }),
  { watch: [page] }
)

const users = computed(() => data.value?.data.items ?? [])
const pagination = computed(() => data.value?.data.pagination)

const roleFilterItems = computed(() => [
  { label: 'Semua Role', value: FILTER_ALL },
  { label: roleLabels.HRD, value: 'HRD' },
  { label: roleLabels.KARYAWAN, value: 'KARYAWAN' }
])

function applyFilters() {
  page.value = 1
  refresh()
}

const exportFilters = computed(() => ({
  search: search.value || undefined,
  role: toFilterValue(role.value)
}))

function roleLabel(roleValue: string) {
  return roleLabels[roleValue as UserRole] ?? roleValue
}

function roleColor(roleValue: string) {
  return roleValue === 'HRD' ? 'primary' : 'neutral'
}

function openDelete(user: { id: number, nama: string, _count?: { barang: number } }) {
  userToDelete.value = {
    id: user.id,
    nama: user.nama,
    barangCount: user._count?.barang ?? 0
  }
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!userToDelete.value) return
  deleting.value = true
  try {
    await deleteUser(userToDelete.value.id)
    toast.add({ title: 'Berhasil', description: 'Pengguna dihapus', color: 'success' })
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
    userToDelete.value = null
  }
}
</script>

<template>
  <AppDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Pengguna">
        <template #right>
          <div class="flex items-center gap-2">
            <AppReportDownload report-type="pengguna" :filters="exportFilters" />
            <UButton to="/pengguna/tambah" icon="i-lucide-plus" label="Tambah Pengguna" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <div class="space-y-4">
      <UAlert
        icon="i-lucide-shield"
        color="info"
        variant="subtle"
        title="Kelola akun karyawan"
        description="Hanya HRD yang dapat menambah, mengubah, dan menghapus pengguna."
      />

      <UCard :ui="{ root: 'overflow-visible relative z-10' }">
        <div class="grid gap-3 sm:grid-cols-3">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Cari nama atau email..."
            @keyup.enter="applyFilters"
          />
          <AppFilterSelect v-model="role" :items="roleFilterItems" placeholder="Filter role" />
          <UButton label="Terapkan Filter" block @click="applyFilters" />
        </div>
      </UCard>

      <UCard :ui="{ body: 'p-0 sm:p-0' }">
        <div v-if="pending" class="p-8 text-center text-muted">Memuat data...</div>
        <div v-else-if="users.length === 0" class="p-8 text-center">
          <UIcon name="i-lucide-users" class="size-10 text-muted mx-auto mb-2" />
          <p class="text-muted">Belum ada pengguna tercatat</p>
          <UButton to="/pengguna/tambah" class="mt-4" label="Tambah Pengguna" />
        </div>

        <template v-else>
          <div class="divide-y divide-default">
            <div
              v-for="item in users"
              :key="item.id"
              class="flex items-center justify-between gap-4 p-4"
            >
              <div>
                <div class="flex items-center gap-2">
                  <p class="font-medium">{{ item.nama }}</p>
                  <UBadge :color="roleColor(item.role)" variant="subtle" :label="roleLabel(item.role)" />
                  <UBadge
                    v-if="item.id === currentUser?.id"
                    color="info"
                    variant="subtle"
                    label="Anda"
                  />
                </div>
                <p class="text-sm text-muted mt-0.5">{{ item.email }}</p>
                <p class="text-xs text-muted mt-1">
                  {{ item._count?.barang ?? 0 }} barang ditugaskan
                </p>
              </div>
              <div class="flex gap-1">
                <UButton
                  :to="`/pengguna/${item.id}/edit`"
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-pencil"
                />
                <UButton
                  size="sm"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  :disabled="item.id === currentUser?.id"
                  @click="openDelete(item)"
                />
              </div>
            </div>
          </div>

          <AppTablePagination
            v-if="pagination"
            v-model:page="page"
            :pagination="pagination"
            label="pengguna"
          />
        </template>
      </UCard>
    </div>

    <UModal v-model:open="showDeleteModal" title="Hapus Pengguna" :ui="{ content: 'w-[calc(100vw-2rem)] max-w-lg' }">
      <template #body>
        <p class="text-muted">
          Yakin ingin menghapus pengguna <strong>{{ userToDelete?.nama }}</strong>?
        </p>
        <p v-if="userToDelete?.barangCount" class="text-sm text-warning mt-2">
          {{ userToDelete.barangCount }} barang yang ditugaskan ke pengguna ini akan dilepas.
        </p>
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
