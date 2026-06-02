<script setup lang="ts">
import { ENTITY_TYPES } from '../../../../shared/types/history'

definePageMeta({ layout: 'default' })

const route = useRoute()
const { user } = useAuth()
const { fetchBarang, deleteBarang } = useBarang()
const { labelFor, statusColor, MASTER_GROUPS } = useMasterOptions()
const toast = useToast()

const id = Number(route.params.id)
const isHrd = computed(() => user.value?.role === 'HRD')
const showDeleteModal = ref(false)
const deleting = ref(false)

useSeoMeta({ title: 'Detail Barang - Inventaris App' })

const { data, error } = await useAuthenticatedAsyncData(
  () => `barang-${id}`,
  () => fetchBarang(id)
)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Barang tidak ditemukan' })
}

const barang = computed(() => data.value?.data)
const isSewa = computed(() => barang.value?.tipePerolehan === 'SEWA')

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

async function confirmDelete() {
  deleting.value = true
  try {
    await deleteBarang(id)
    toast.add({ title: 'Berhasil', description: 'Barang berhasil dihapus', color: 'success' })
    await navigateTo('/barang')
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
  }
}
</script>

<template>
  <AppDashboardPanel v-if="barang">
    <template #header>
      <UDashboardNavbar :title="barang.nama">
        <template #leading>
          <UButton to="/barang" icon="i-lucide-arrow-left" color="neutral" variant="ghost" />
        </template>
        <template #right>
          <UButton v-if="isHrd" :to="`/barang/${id}/edit`" icon="i-lucide-pencil" label="Edit" />
          <UButton v-if="isHrd" icon="i-lucide-trash-2" color="error" variant="ghost" label="Hapus" @click="showDeleteModal = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <div class="space-y-4">
      <UCard>
        <div class="grid gap-6 sm:grid-cols-2">
          <div>
            <p class="text-sm text-muted">Nama</p>
            <p class="font-medium mt-1">{{ barang.nama }}</p>
          </div>
          <div>
            <p class="text-sm text-muted">Status</p>
            <UBadge
              class="mt-1"
              :color="statusColor(barang.status)"
              variant="subtle"
              :label="labelFor(MASTER_GROUPS.STATUS_BARANG, barang.status)"
            />
          </div>
          <div>
            <p class="text-sm text-muted">Kategori</p>
            <p class="font-medium mt-1">{{ labelFor(MASTER_GROUPS.KATEGORI_BARANG, barang.kategori) }}</p>
          </div>
          <div>
            <p class="text-sm text-muted">Tipe Perolehan</p>
            <UBadge
              class="mt-1"
              :color="isSewa ? 'info' : 'neutral'"
              variant="subtle"
              :label="labelFor(MASTER_GROUPS.TIPE_PEROLEHAN, barang.tipePerolehan)"
            />
          </div>
          <div>
            <p class="text-sm text-muted">Merk</p>
            <p class="font-medium mt-1">{{ barang.merk || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-muted">Nomor Seri / Plat</p>
            <p class="font-medium mt-1">{{ barang.nomorSeri || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-muted">Lokasi</p>
            <p class="font-medium mt-1">{{ barang.lokasi || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-muted">Ditugaskan ke</p>
            <p v-if="barang.user" class="font-medium mt-1">{{ barang.user.nama }}</p>
            <UBadge v-else class="mt-1" color="neutral" variant="subtle" label="Belum ditugaskan" />
          </div>
        </div>
      </UCard>

      <UCard v-if="isSewa">
        <template #header>
          <h3 class="font-semibold">Informasi Sewa Vendor</h3>
        </template>
        <div class="grid gap-6 sm:grid-cols-2">
          <div>
            <p class="text-sm text-muted">Vendor</p>
            <p class="font-medium mt-1">{{ barang.vendor?.nama || '-' }}</p>
            <UBadge
              v-if="barang.vendor"
              class="mt-1"
              variant="subtle"
              :label="labelFor(MASTER_GROUPS.JENIS_VENDOR, barang.vendor.jenis)"
            />
          </div>
          <div>
            <p class="text-sm text-muted">Kontak Vendor</p>
            <p class="font-medium mt-1">{{ barang.vendor?.telepon || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-muted">Tanggal Mulai Sewa</p>
            <p class="font-medium mt-1">{{ formatDate(barang.tanggalMulaiSewa) }}</p>
          </div>
          <div>
            <p class="text-sm text-muted">Tanggal Akhir Sewa</p>
            <p class="font-medium mt-1">
              {{ barang.tanggalAkhirSewa ? formatDate(barang.tanggalAkhirSewa) : 'Kontrak masih berjalan' }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard v-else>
        <template #header>
          <h3 class="font-semibold">Informasi Pembelian</h3>
        </template>
        <div>
          <p class="text-sm text-muted">Tanggal Pembelian</p>
          <p class="font-medium mt-1">{{ formatDate(barang.tanggalPembelian) }}</p>
        </div>
      </UCard>

      <AppHistoryTimeline
        :entity-type="ENTITY_TYPES.BARANG"
        :entity-id="id"
        :limit="10"
      />
    </div>

    <UModal v-model:open="showDeleteModal" title="Hapus Barang" :ui="{ content: 'w-[calc(100vw-2rem)] max-w-lg' }">
      <template #body>
        <p class="text-muted">
          Yakin ingin menghapus <strong>{{ barang.nama }}</strong>?
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
