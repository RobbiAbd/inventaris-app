<script setup lang="ts">
import type { PerbaikanInput } from '../../shared/types/perbaikan'
import { MASTER_GROUPS } from '../../shared/types/master'
import { formatCurrencyInput, formatRupiah, parseCurrencyInput } from '../../shared/utils/currency'

const props = defineProps<{
  barangId: number
  barangStatus: string
  isHrd?: boolean
}>()

const { fetchPerbaikanList, createPerbaikan, uploadPerbaikanEvidence } = usePerbaikan()
const { labelFor, toSelectItems, MASTER_GROUPS: GROUPS } = useMasterOptions()
const toast = useToast()

const showModal = ref(false)
const saving = ref(false)
const evidenceFieldRef = ref<{
  getPayload: () => { newEvidenceFiles?: File[] }
  reset: () => void
} | null>(null)

const form = reactive<PerbaikanInput>({
  tanggal: new Date().toISOString().slice(0, 10),
  deskripsi: '',
  biaya: undefined,
  lokasiServis: '',
  statusSesudah: props.barangStatus,
  catatan: ''
})

const biayaDisplay = ref(formatCurrencyInput(form.biaya))

function onBiayaInput(raw: string) {
  const parsed = parseCurrencyInput(raw)
  biayaDisplay.value = formatCurrencyInput(parsed)
  form.biaya = parsed
}

function resetForm() {
  form.tanggal = new Date().toISOString().slice(0, 10)
  form.deskripsi = ''
  form.biaya = undefined
  biayaDisplay.value = ''
  form.lokasiServis = ''
  form.statusSesudah = props.barangStatus
  form.catatan = ''
  evidenceFieldRef.value?.reset()
}

const { data, pending, refresh } = await useAuthenticatedAsyncData(
  () => `perbaikan-${props.barangId}`,
  () => fetchPerbaikanList(props.barangId)
)

const items = computed(() => data.value?.data ?? [])
const statusItems = computed(() => toSelectItems(GROUPS.STATUS_BARANG))

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

async function save() {
  if (!form.deskripsi.trim()) {
    toast.add({ title: 'Validasi gagal', description: 'Deskripsi wajib diisi', color: 'error' })
    return
  }

  saving.value = true
  try {
    const response = await createPerbaikan(props.barangId, form)
    const newFiles = evidenceFieldRef.value?.getPayload().newEvidenceFiles ?? []

    if (newFiles.length) {
      await uploadPerbaikanEvidence(props.barangId, response.data.id, newFiles)
    }

    toast.add({ title: 'Berhasil', description: 'Riwayat perbaikan ditambahkan', color: 'success' })
    showModal.value = false
    resetForm()
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

watch(showModal, (open) => {
  if (open) {
    form.statusSesudah = props.barangStatus
  }
})

defineExpose({ refresh })
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-wrench" class="size-5 text-primary" />
          <h3 class="font-semibold">Riwayat Perbaikan</h3>
        </div>
        <UButton
          v-if="isHrd"
          size="sm"
          icon="i-lucide-plus"
          label="Tambah"
          @click="showModal = true"
        />
      </div>
    </template>

    <div v-if="pending" class="py-6 text-center text-muted text-sm">Memuat riwayat perbaikan...</div>
    <div v-else-if="items.length === 0" class="py-6 text-center text-muted text-sm">
      Belum ada riwayat perbaikan.
    </div>
    <div v-else class="space-y-3">
      <div
        v-for="item in items"
        :key="item.id"
        class="rounded-lg border border-default p-4 space-y-2"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p class="font-medium">{{ formatDate(item.tanggal) }}</p>
            <p class="text-sm text-muted">{{ item.createdBy?.nama ?? 'Sistem' }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-if="item.statusSebelum"
              color="neutral"
              variant="subtle"
              :label="labelFor(GROUPS.STATUS_BARANG, item.statusSebelum)"
            />
            <UIcon v-if="item.statusSesudah" name="i-lucide-arrow-right" class="size-4 text-muted" />
            <UBadge
              v-if="item.statusSesudah"
              color="info"
              variant="subtle"
              :label="labelFor(GROUPS.STATUS_BARANG, item.statusSesudah)"
            />
          </div>
        </div>
        <p class="text-sm">{{ item.deskripsi }}</p>
        <div class="flex flex-wrap gap-4 text-xs text-muted">
          <span v-if="item.lokasiServis">Lokasi: {{ item.lokasiServis }}</span>
          <span>Biaya: {{ formatRupiah(item.biaya) }}</span>
        </div>
        <p v-if="item.catatan" class="text-xs text-muted border-t border-default pt-2">{{ item.catatan }}</p>
        <div v-if="item.evidence?.length" class="grid gap-2 grid-cols-2 sm:grid-cols-3 pt-2 border-t border-default">
          <a
            v-for="evidence in item.evidence"
            :key="evidence.id"
            :href="evidence.url"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-md border border-default overflow-hidden hover:border-primary transition-colors"
          >
            <img :src="evidence.url" :alt="evidence.originalName" class="h-24 w-full object-cover bg-muted/30">
          </a>
        </div>
      </div>
    </div>

    <UModal v-model:open="showModal" title="Tambah Riwayat Perbaikan" :ui="{ content: 'w-[calc(100vw-2rem)] max-w-lg' }">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Tanggal Perbaikan" required>
            <UInput v-model="form.tanggal" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Deskripsi" required>
            <UTextarea v-model="form.deskripsi" :rows="3" class="w-full" placeholder="Contoh: Ganti keyboard laptop rusak" />
          </UFormField>
          <UFormField label="Lokasi Servis">
            <UInput v-model="form.lokasiServis" placeholder="Bengkel / vendor servis" class="w-full" />
          </UFormField>
          <UFormField label="Biaya (Rp)">
            <UInput
              :model-value="biayaDisplay"
              type="text"
              inputmode="numeric"
              placeholder="Contoh: 1.000.000"
              class="w-full"
              @update:model-value="onBiayaInput"
            />
          </UFormField>
          <UFormField label="Status Setelah Perbaikan">
            <USelectMenu v-model="form.statusSesudah" :items="statusItems" value-key="value" class="w-full" />
          </UFormField>
          <UFormField label="Catatan">
            <UTextarea v-model="form.catatan" :rows="2" class="w-full" />
          </UFormField>
          <AppBarangEvidenceField
            ref="evidenceFieldRef"
            title="Evidence Perbaikan"
            description="Opsional — unggah foto bukti perbaikan. Maks. 10 gambar, 5 MB per file (JPEG, PNG, WebP, GIF)."
          />
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton label="Batal" color="neutral" variant="ghost" @click="showModal = false" />
          <UButton label="Simpan" :loading="saving" @click="save" />
        </div>
      </template>
    </UModal>
  </UCard>
</template>
