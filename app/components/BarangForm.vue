<script setup lang="ts">
import type { BarangInput, BarangItem, BarangSubmitPayload } from '../../shared/types/barang'
import { getJenisVendorKodeForKategori } from '../../shared/types/vendor'
import { MASTER_GROUPS } from '../../shared/types/master'
import { formatCurrencyInput, parseCurrencyInput } from '../../shared/utils/currency'

const props = defineProps<{
  initialData?: BarangItem | null
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: BarangSubmitPayload]
}>()

const { fetchUsers } = useBarang()
const { fetchVendorList } = useVendor()
const {
  toSelectItems,
  kategoriConfig,
  validateBarangForm,
  optionsFor,
  labelFor,
  MASTER_GROUPS: GROUPS
} = useMasterOptions()
const toast = useToast()

const evidenceFieldRef = ref<{ getPayload: () => Pick<BarangSubmitPayload, 'newEvidenceFiles' | 'removeEvidenceIds'> } | null>(null)

const { data: usersResponse } = await useAuthenticatedAsyncData('users-select', () => fetchUsers())
const { data: vendorsResponse, refresh: refreshVendors } = await useAuthenticatedAsyncData(
  'vendors-select',
  () => fetchVendorList({ all: true })
)

interface BarangFormState {
  nama: string
  kategori: string
  merk: string
  nomorSeri: string
  status: string
  tipePerolehan: string
  tanggalPembelian?: string
  tanggalMulaiSewa?: string
  tanggalAkhirSewa?: string
  lokasi: string
  harga?: number
  keterangan: string
  userId?: number
  vendorId?: number
}

const state = reactive<BarangFormState>({
  nama: props.initialData?.nama ?? '',
  kategori: props.initialData?.kategori ?? '',
  merk: props.initialData?.merk ?? '',
  nomorSeri: props.initialData?.nomorSeri ?? '',
  status: props.initialData?.status ?? 'BAIK',
  tipePerolehan: props.initialData?.tipePerolehan ?? 'BELI',
  tanggalPembelian: props.initialData?.tanggalPembelian?.slice(0, 10),
  tanggalMulaiSewa: props.initialData?.tanggalMulaiSewa?.slice(0, 10),
  tanggalAkhirSewa: props.initialData?.tanggalAkhirSewa?.slice(0, 10),
  lokasi: props.initialData?.lokasi ?? '',
  harga: props.initialData?.harga ? Number(props.initialData.harga) : undefined,
  keterangan: props.initialData?.keterangan ?? '',
  userId: props.initialData?.userId ?? undefined,
  vendorId: props.initialData?.vendorId ?? undefined
})

const hargaDisplay = ref(formatCurrencyInput(state.harga))

function onHargaInput(raw: string) {
  const parsed = parseCurrencyInput(raw)
  hargaDisplay.value = formatCurrencyInput(parsed)
  state.harga = parsed
}

const kategoriItems = computed(() => toSelectItems(GROUPS.KATEGORI_BARANG))
const statusItems = computed(() => toSelectItems(GROUPS.STATUS_BARANG))
const tipeItems = computed(() => toSelectItems(GROUPS.TIPE_PEROLEHAN))

const config = computed(() => kategoriConfig(state.kategori))
const isSewa = computed(() => state.tipePerolehan === 'SEWA')
const wajibAssign = computed(() => config.value.wajibAssignUser === true)
const kategoriSewa = computed(() => config.value.wajibSewa === true)

watch(() => state.kategori, async (kategori) => {
  const cfg = kategoriConfig(kategori)
  if (cfg.wajibSewa) {
    state.tipePerolehan = 'SEWA'
  }
  await refreshVendors()
})

const userItems = computed(() =>
  (usersResponse.value?.data.items ?? []).map(user => ({
    label: `${user.nama} (${user.role})`,
    value: user.id
  }))
)

const vendorItems = computed(() => {
  const jenisKode = getJenisVendorKodeForKategori(
    optionsFor(GROUPS.KATEGORI_BARANG, false),
    state.kategori
  )
  const vendors = vendorsResponse.value?.data.items ?? []
  const filtered = jenisKode
    ? vendors.filter(v => v.jenis === jenisKode || v.jenis === 'LAINNYA')
    : vendors

  return filtered.map(vendor => ({
    label: `${vendor.nama} (${labelFor(GROUPS.JENIS_VENDOR, vendor.jenis)})`,
    value: vendor.id
  }))
})

function onSubmit() {
  const parsed = validateBarangForm({ ...state })

  if (!parsed.success) {
    toast.add({
      title: 'Validasi gagal',
      description: parsed.error.issues[0]?.message ?? 'Periksa kembali form',
      color: 'error'
    })
    return
  }

  const evidencePayload = evidenceFieldRef.value?.getPayload() ?? {}

  emit('submit', {
    data: parsed.data,
    ...evidencePayload
  })
}
</script>

<template>
  <UCard>
    <UForm :state="state" class="space-y-6" @submit="onSubmit">
      <div>
        <h3 class="font-medium mb-3">Informasi Umum</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Nama Barang / Layanan" name="nama" required>
            <UInput v-model="state.nama" placeholder="Contoh: Galon Aqua, Mobil Avanza" class="w-full" />
          </UFormField>

          <UFormField label="Kategori" name="kategori" required>
            <USelectMenu v-model="state.kategori" :items="kategoriItems" value-key="value" placeholder="Pilih kategori" class="w-full" />
          </UFormField>

          <UFormField label="Merk" name="merk">
            <UInput v-model="state.merk" placeholder="Opsional" class="w-full" />
          </UFormField>

          <UFormField label="Nomor Seri / Plat" name="nomorSeri">
            <UInput v-model="state.nomorSeri" placeholder="Opsional" class="w-full" />
          </UFormField>

          <UFormField label="Status" name="status" required>
            <USelectMenu v-model="state.status" :items="statusItems" value-key="value" placeholder="Pilih status" class="w-full" />
          </UFormField>

          <UFormField label="Lokasi" name="lokasi">
            <UInput v-model="state.lokasi" placeholder="Contoh: Ruang HRD, Gudang" class="w-full" />
          </UFormField>

          <UFormField label="Harga (Rp)" name="harga" help="Opsional — nilai pembelian atau estimasi harga barang">
            <UInput
              :model-value="hargaDisplay"
              type="text"
              inputmode="numeric"
              placeholder="Contoh: 1.000.000"
              class="w-full"
              @update:model-value="onHargaInput"
            />
          </UFormField>

          <UFormField label="Keterangan" name="keterangan" class="sm:col-span-2">
            <UTextarea
              v-model="state.keterangan"
              placeholder="Catatan bebas tentang kondisi, riwayat, atau hal penting lainnya..."
              :rows="4"
              class="w-full"
            />
          </UFormField>
        </div>
      </div>

      <USeparator />

      <div>
        <h3 class="font-medium mb-1">Cara Perolehan</h3>
        <p class="text-sm text-muted mb-3">
          Aturan kategori (wajib sewa / wajib assign) dikelola di Pengaturan Master Data.
        </p>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Tipe Perolehan" name="tipePerolehan" required :help="kategoriSewa ? 'Kategori ini wajib sewa' : undefined">
            <USelectMenu v-model="state.tipePerolehan" :items="tipeItems" value-key="value" :disabled="kategoriSewa" class="w-full" />
          </UFormField>

          <UFormField v-if="!isSewa" label="Tanggal Pembelian" name="tanggalPembelian">
            <UInput v-model="state.tanggalPembelian" type="date" class="w-full" />
          </UFormField>

          <template v-else>
            <UFormField label="Vendor" name="vendorId" required>
              <USelectMenu v-model="state.vendorId" :items="vendorItems" value-key="value" placeholder="Pilih vendor" class="w-full" />
            </UFormField>
            <p class="text-xs text-muted sm:col-span-2 -mt-2">
              Belum ada vendor? <NuxtLink to="/vendor/tambah" class="text-primary hover:underline">Tambah vendor baru</NuxtLink>
            </p>
            <UFormField label="Tanggal Mulai Sewa" name="tanggalMulaiSewa" required>
              <UInput v-model="state.tanggalMulaiSewa" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Tanggal Akhir Sewa" name="tanggalAkhirSewa" help="Kosongkan jika kontrak masih berjalan">
              <UInput v-model="state.tanggalAkhirSewa" type="date" class="w-full" />
            </UFormField>
          </template>
        </div>
      </div>

      <USeparator />

      <UFormField
        label="Ditugaskan ke Karyawan"
        name="userId"
        :required="wajibAssign"
        help="Aturan wajib assign diatur per kategori di Master Data"
      >
        <USelectMenu v-model="state.userId" :items="userItems" value-key="value" placeholder="Pilih karyawan" class="w-full" />
      </UFormField>

      <USeparator />

      <AppBarangEvidenceField
        ref="evidenceFieldRef"
        :existing="initialData?.evidence"
      />

      <div class="flex justify-end gap-2 pt-2">
        <UButton to="/barang" color="neutral" variant="ghost" label="Batal" />
        <UButton type="submit" :loading="loading" :label="initialData ? 'Simpan Perubahan' : 'Simpan Barang'" />
      </div>
    </UForm>
  </UCard>
</template>
