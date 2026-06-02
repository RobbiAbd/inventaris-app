<script setup lang="ts">
import {
  PENGAJUAN_JENIS,
  PENGAJUAN_JENIS_LABELS,
  type CreatePengajuanInput,
  type PengajuanJenis
} from '../../shared/types/pengajuan'
import { MASTER_GROUPS } from '../../shared/types/master'

const props = defineProps<{
  barangId: number
  barangStatus: string
}>()

const emit = defineEmits<{ submitted: [] }>()

const open = defineModel<boolean>('open', { default: false })
const { createPengajuan } = usePengajuanApi()
const { toSelectItems, MASTER_GROUPS: GROUPS } = useMasterOptions()
const toast = useToast()
const saving = ref(false)

const form = reactive({
  jenis: PENGAJUAN_JENIS.UBAH_STATUS as PengajuanJenis,
  alasan: '',
  statusBaru: props.barangStatus,
  deskripsiPerbaikan: '',
  tanggalPerbaikan: new Date().toISOString().slice(0, 10),
  lokasiServis: '',
  biayaPerbaikan: undefined as number | undefined
})

const jenisItems = computed(() =>
  Object.values(PENGAJUAN_JENIS).map(value => ({
    label: PENGAJUAN_JENIS_LABELS[value],
    value
  }))
)

const statusItems = computed(() => toSelectItems(GROUPS.STATUS_BARANG))

watch(() => props.barangStatus, (status) => {
  form.statusBaru = status
})

async function submit() {
  saving.value = true
  try {
    const payload: CreatePengajuanInput = {
      barangId: props.barangId,
      jenis: form.jenis,
      alasan: form.alasan,
      payload: form.jenis === PENGAJUAN_JENIS.UBAH_STATUS
        ? { statusBaru: form.statusBaru }
        : form.jenis === PENGAJUAN_JENIS.AJUKAN_PERBAIKAN
          ? {
              deskripsiPerbaikan: form.deskripsiPerbaikan,
              tanggalPerbaikan: form.tanggalPerbaikan,
              lokasiServis: form.lokasiServis || undefined,
              biayaPerbaikan: form.biayaPerbaikan
            }
          : undefined
    }

    await createPengajuan(payload)
    toast.add({ title: 'Berhasil', description: 'Pengajuan dikirim ke HRD', color: 'success' })
    open.value = false
    form.alasan = ''
    emit('submitted')
  } catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string }, statusMessage?: string }
    toast.add({
      title: 'Gagal mengirim',
      description: fetchError.data?.statusMessage ?? fetchError.statusMessage ?? 'Terjadi kesalahan',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Ajukan Perubahan Barang" :ui="{ content: 'w-[calc(100vw-2rem)] max-w-lg' }">
    <template #body>
      <div class="space-y-4">
        <UFormField label="Jenis Pengajuan" required>
          <USelectMenu v-model="form.jenis" :items="jenisItems" value-key="value" class="w-full" />
        </UFormField>

        <UFormField v-if="form.jenis === PENGAJUAN_JENIS.UBAH_STATUS" label="Status Baru" required>
          <USelectMenu v-model="form.statusBaru" :items="statusItems" value-key="value" class="w-full" />
        </UFormField>

        <template v-if="form.jenis === PENGAJUAN_JENIS.AJUKAN_PERBAIKAN">
          <UFormField label="Deskripsi Perbaikan" required>
            <UTextarea v-model="form.deskripsiPerbaikan" :rows="3" class="w-full" />
          </UFormField>
          <UFormField label="Tanggal Perbaikan">
            <UInput v-model="form.tanggalPerbaikan" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Lokasi Servis">
            <UInput v-model="form.lokasiServis" class="w-full" />
          </UFormField>
          <UFormField label="Estimasi Biaya (Rp)">
            <UInput v-model.number="form.biayaPerbaikan" type="number" min="0" class="w-full" />
          </UFormField>
        </template>

        <UFormField
          label="Alasan / Keterangan"
          required
          help="Jelaskan mengapa pengajuan ini diperlukan (min. 10 karakter)"
        >
          <UTextarea v-model="form.alasan" :rows="4" class="w-full" />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton label="Batal" color="neutral" variant="ghost" @click="open = false" />
        <UButton label="Kirim Pengajuan" :loading="saving" @click="submit" />
      </div>
    </template>
  </UModal>
</template>
