<script setup lang="ts">
import type { UserFormData, UserItem } from '../../shared/types/user'
import { ROLES, roleLabels } from '../../shared/types/user'

const props = defineProps<{
  initialData?: UserItem | null
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: UserFormData]
}>()

const toast = useToast()
const isEdit = computed(() => !!props.initialData)

const state = reactive({
  nama: props.initialData?.nama ?? '',
  email: props.initialData?.email ?? '',
  password: '',
  role: props.initialData?.role ?? 'KARYAWAN'
})

const roleItems = ROLES.map(role => ({
  label: roleLabels[role],
  value: role
}))

function onSubmit() {
  const payload = {
    nama: state.nama.trim(),
    email: state.email.trim(),
    role: state.role,
    ...(state.password ? { password: state.password } : {})
  }

  if (!isEdit.value && !state.password) {
    toast.add({
      title: 'Validasi gagal',
      description: 'Password wajib diisi',
      color: 'error'
    })
    return
  }

  if (state.password && state.password.length < 6) {
    toast.add({
      title: 'Validasi gagal',
      description: 'Password minimal 6 karakter',
      color: 'error'
    })
    return
  }

  if (!payload.nama || !payload.email) {
    toast.add({
      title: 'Validasi gagal',
      description: 'Nama dan email wajib diisi',
      color: 'error'
    })
    return
  }

  emit('submit', payload)
}
</script>

<template>
  <UCard>
    <UForm :state="state" class="space-y-4" @submit="onSubmit">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Nama Lengkap" name="nama" required class="sm:col-span-2">
          <UInput v-model="state.nama" placeholder="Contoh: Budi Santoso" class="w-full" />
        </UFormField>

        <UFormField label="Email" name="email" required class="sm:col-span-2">
          <UInput v-model="state.email" type="email" placeholder="nama@perusahaan.com" class="w-full" />
        </UFormField>

        <UFormField
          :label="isEdit ? 'Password Baru' : 'Password'"
          name="password"
          :required="!isEdit"
          class="sm:col-span-2"
        >
          <UInput
            v-model="state.password"
            type="password"
            :placeholder="isEdit ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Role" name="role" required class="sm:col-span-2">
          <USelectMenu
            v-model="state.role"
            :items="roleItems"
            value-key="value"
            placeholder="Pilih role"
            class="w-full"
          />
        </UFormField>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <UButton to="/pengguna" color="neutral" variant="ghost" label="Batal" />
        <UButton
          type="submit"
          :loading="loading"
          :label="isEdit ? 'Simpan Perubahan' : 'Simpan Pengguna'"
        />
      </div>
    </UForm>
  </UCard>
</template>
