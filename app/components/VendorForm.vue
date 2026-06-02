<script setup lang="ts">
import type { VendorInput, VendorItem } from '../../shared/types/vendor'
import { MASTER_GROUPS } from '../../shared/types/master'

const props = defineProps<{
  initialData?: VendorItem | null
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: VendorInput]
}>()

const { toSelectItems, validateVendorForm, MASTER_GROUPS: GROUPS } = useMasterOptions()
const toast = useToast()

const state = reactive<VendorInput>({
  nama: props.initialData?.nama ?? '',
  jenis: props.initialData?.jenis ?? '',
  kontak: props.initialData?.kontak ?? '',
  telepon: props.initialData?.telepon ?? '',
  email: props.initialData?.email ?? '',
  alamat: props.initialData?.alamat ?? ''
})

const jenisItems = computed(() => toSelectItems(GROUPS.JENIS_VENDOR))

function onSubmit() {
  const parsed = validateVendorForm({ ...state })

  if (!parsed.success) {
    toast.add({
      title: 'Validasi gagal',
      description: parsed.error.issues[0]?.message ?? 'Periksa kembali form',
      color: 'error'
    })
    return
  }

  emit('submit', parsed.data)
}
</script>

<template>
  <UCard>
    <UForm :state="state" class="space-y-4" @submit="onSubmit">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Nama Vendor" name="nama" required class="sm:col-span-2">
          <UInput v-model="state.nama" placeholder="Contoh: PT Aqua Galon Sejahtera" class="w-full" />
        </UFormField>

        <UFormField label="Jenis Layanan" name="jenis" required>
          <USelectMenu v-model="state.jenis" :items="jenisItems" value-key="value" placeholder="Pilih jenis" class="w-full" />
        </UFormField>

        <UFormField label="Nama Kontak" name="kontak">
          <UInput v-model="state.kontak" placeholder="Nama PIC vendor" class="w-full" />
        </UFormField>

        <UFormField label="Telepon" name="telepon">
          <UInput v-model="state.telepon" placeholder="08xx..." class="w-full" />
        </UFormField>

        <UFormField label="Email" name="email">
          <UInput v-model="state.email" type="email" placeholder="vendor@email.com" class="w-full" />
        </UFormField>

        <UFormField label="Alamat" name="alamat" class="sm:col-span-2">
          <UTextarea v-model="state.alamat" placeholder="Alamat vendor" class="w-full" />
        </UFormField>
      </div>

      <p class="text-xs text-muted">
        Jenis vendor dikelola di
        <NuxtLink to="/pengaturan/master-data" class="text-primary hover:underline">Pengaturan Master Data</NuxtLink>.
      </p>

      <div class="flex justify-end gap-2 pt-2">
        <UButton to="/vendor" color="neutral" variant="ghost" label="Batal" />
        <UButton type="submit" :loading="loading" :label="initialData ? 'Simpan Perubahan' : 'Simpan Vendor'" />
      </div>
    </UForm>
  </UCard>
</template>
