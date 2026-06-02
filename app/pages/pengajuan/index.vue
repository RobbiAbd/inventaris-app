<script setup lang="ts">
import {
  PENGAJUAN_JENIS_LABELS,
  PENGAJUAN_STATUS,
  PENGAJUAN_STATUS_LABELS,
  type PengajuanItem,
  type PengajuanStatus
} from '../../../shared/types/pengajuan'
import { FILTER_ALL, toFilterValue } from '../../../shared/constants/filter'
import { DEFAULT_PAGE_SIZE } from '../../../shared/types/pagination'

definePageMeta({ layout: 'default' })

const { user } = useAuth()
const { fetchPengajuanList, reviewPengajuan } = usePengajuanApi()
const { labelFor, MASTER_GROUPS: GROUPS } = useMasterOptions()
const toast = useToast()

const isHrd = computed(() => user.value?.role === 'HRD')
const page = ref(1)
const status = ref(FILTER_ALL)
const showReviewModal = ref(false)
const reviewing = ref(false)
const selected = ref<PengajuanItem | null>(null)
const reviewAction = ref<'approve' | 'reject'>('approve')
const catatanReviewer = ref('')

useSeoMeta({ title: 'Pengajuan Barang - Inventaris App' })

const statusFilterItems = computed(() => [
  { label: 'Semua Status', value: FILTER_ALL },
  ...Object.values(PENGAJUAN_STATUS).map(value => ({
    label: PENGAJUAN_STATUS_LABELS[value],
    value
  }))
])

const { data, pending, refresh } = await useAuthenticatedAsyncData(
  'pengajuan-list',
  () => fetchPengajuanList({
    page: page.value,
    limit: DEFAULT_PAGE_SIZE,
    status: toFilterValue(status.value),
    mine: !isHrd.value
  }),
  { watch: [page, () => user.value?.role] }
)

const items = computed(() => data.value?.data.items ?? [])
const pagination = computed(() => data.value?.data.pagination)

function applyFilters() {
  page.value = 1
  refresh()
}

function statusColor(statusValue: PengajuanStatus) {
  if (statusValue === PENGAJUAN_STATUS.DISETUJUI) return 'success'
  if (statusValue === PENGAJUAN_STATUS.DITOLAK) return 'error'
  return 'warning'
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function openReview(item: PengajuanItem, action: 'approve' | 'reject') {
  selected.value = item
  reviewAction.value = action
  catatanReviewer.value = ''
  showReviewModal.value = true
}

async function confirmReview() {
  if (!selected.value) return
  reviewing.value = true
  try {
    await reviewPengajuan(selected.value.id, {
      action: reviewAction.value,
      catatanReviewer: catatanReviewer.value || undefined
    })
    toast.add({
      title: 'Berhasil',
      description: reviewAction.value === 'approve' ? 'Pengajuan disetujui' : 'Pengajuan ditolak',
      color: 'success'
    })
    showReviewModal.value = false
    await refresh()
  } catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string }, statusMessage?: string }
    toast.add({
      title: 'Gagal memproses',
      description: fetchError.data?.statusMessage ?? fetchError.statusMessage ?? 'Terjadi kesalahan',
      color: 'error'
    })
  } finally {
    reviewing.value = false
  }
}
</script>

<template>
  <AppDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="isHrd ? 'Pengajuan Barang' : 'Pengajuan Saya'" />
    </template>

    <div class="space-y-4">
      <UAlert
        icon="i-lucide-clipboard-list"
        color="info"
        variant="subtle"
        :title="isHrd ? 'Review pengajuan karyawan' : 'Ajukan perubahan barang'"
        :description="isHrd
          ? 'Setujui atau tolak permintaan ubah status, ganti barang, dan catat perbaikan.'
          : 'Buat pengajuan dari halaman detail barang yang ditugaskan ke Anda.'"
      />

      <UCard :ui="{ root: 'overflow-visible relative z-10' }">
        <div class="grid gap-3 sm:grid-cols-2">
          <AppFilterSelect v-model="status" :items="statusFilterItems" placeholder="Filter status" />
          <UButton label="Terapkan Filter" block @click="applyFilters" />
        </div>
      </UCard>

      <UCard :ui="{ body: 'p-0 sm:p-0' }">
        <div v-if="pending" class="p-8 text-center text-muted">Memuat pengajuan...</div>
        <div v-else-if="items.length === 0" class="p-8 text-center text-muted">
          Belum ada pengajuan.
        </div>
        <div v-else class="divide-y divide-default">
          <div v-for="item in items" :key="item.id" class="p-4 space-y-3">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0 space-y-1">
                <div class="flex flex-wrap items-center gap-2">
                  <UBadge variant="subtle" :label="PENGAJUAN_JENIS_LABELS[item.jenis]" />
                  <UBadge :color="statusColor(item.status)" variant="subtle" :label="PENGAJUAN_STATUS_LABELS[item.status]" />
                </div>
                <p class="font-medium">
                  <NuxtLink :to="`/barang/${item.barangId}`" class="hover:text-primary">
                    {{ item.barang?.nama ?? `Barang #${item.barangId}` }}
                  </NuxtLink>
                </p>
                <p v-if="isHrd" class="text-sm text-muted">Oleh: {{ item.user?.nama }}</p>
                <p class="text-xs text-muted">{{ formatDateTime(item.createdAt) }}</p>
              </div>
              <div v-if="isHrd && item.status === PENGAJUAN_STATUS.MENUNGGU" class="flex gap-2 shrink-0">
                <UButton size="sm" color="success" variant="soft" label="Setujui" @click="openReview(item, 'approve')" />
                <UButton size="sm" color="error" variant="soft" label="Tolak" @click="openReview(item, 'reject')" />
              </div>
            </div>

            <p class="text-sm">{{ item.alasan }}</p>

            <div v-if="item.payload" class="text-xs text-muted space-y-1 rounded bg-muted/40 p-3">
              <p v-if="item.payload.statusBaru">
                Status diajukan: {{ labelFor(GROUPS.STATUS_BARANG, item.payload.statusBaru) }}
              </p>
              <p v-if="item.payload.deskripsiPerbaikan">
                Perbaikan: {{ item.payload.deskripsiPerbaikan }}
              </p>
            </div>

            <p v-if="item.catatanReviewer" class="text-xs text-muted">
              Catatan HRD: {{ item.catatanReviewer }}
            </p>
          </div>
        </div>

        <AppTablePagination
          v-if="pagination && items.length"
          v-model:page="page"
          :pagination="pagination"
          label="pengajuan"
        />
      </UCard>
    </div>

    <UModal
      v-model:open="showReviewModal"
      :title="reviewAction === 'approve' ? 'Setujui Pengajuan' : 'Tolak Pengajuan'"
      :ui="{ content: 'w-[calc(100vw-2rem)] max-w-lg' }"
    >
      <template #body>
        <p class="text-sm text-muted mb-4">
          {{ selected?.barang?.nama }} — {{ selected ? PENGAJUAN_JENIS_LABELS[selected.jenis] : '' }}
        </p>
        <UFormField label="Catatan untuk karyawan (opsional)">
          <UTextarea v-model="catatanReviewer" :rows="3" class="w-full" />
        </UFormField>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton label="Batal" color="neutral" variant="ghost" @click="showReviewModal = false" />
          <UButton
            :label="reviewAction === 'approve' ? 'Setujui' : 'Tolak'"
            :color="reviewAction === 'approve' ? 'success' : 'error'"
            :loading="reviewing"
            @click="confirmReview"
          />
        </div>
      </template>
    </UModal>
  </AppDashboardPanel>
</template>
