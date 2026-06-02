<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { user, refreshSession } = useAuth()
const { updateProfile } = useProfile()
const toast = useToast()
const loading = ref(false)

useSeoMeta({ title: 'Profil Saya - Inventaris App' })

const form = reactive({
  nama: user.value?.nama ?? '',
  email: user.value?.email ?? '',
  passwordSaatIni: '',
  passwordBaru: ''
})

watch(user, (value) => {
  if (!value) return
  form.nama = value.nama
  form.email = value.email
}, { immediate: true })

async function onSubmit() {
  loading.value = true
  try {
    await updateProfile({
      nama: form.nama,
      email: form.email,
      passwordSaatIni: form.passwordSaatIni || undefined,
      passwordBaru: form.passwordBaru || undefined
    })
    await refreshSession()
    form.passwordSaatIni = ''
    form.passwordBaru = ''
    toast.add({ title: 'Berhasil', description: 'Profil diperbarui', color: 'success' })
  } catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string }, statusMessage?: string }
    toast.add({
      title: 'Gagal memperbarui',
      description: fetchError.data?.statusMessage ?? fetchError.statusMessage ?? 'Terjadi kesalahan',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Profil Saya" />
    </template>

    <UCard class="max-w-xl">
      <UForm :state="form" class="space-y-4" @submit="onSubmit">
        <UAlert
          icon="i-lucide-user"
          color="info"
          variant="subtle"
          :title="user?.role === 'HRD' ? 'Akun HRD' : 'Akun Karyawan'"
          description="Perbarui nama, email, atau password login Anda."
        />

        <UFormField label="Nama" required>
          <UInput v-model="form.nama" class="w-full" />
        </UFormField>

        <UFormField label="Email" required>
          <UInput v-model="form.email" type="email" class="w-full" />
        </UFormField>

        <USeparator />

        <p class="text-sm font-medium">Ganti Password (opsional)</p>

        <UFormField label="Password Saat Ini">
          <UInput v-model="form.passwordSaatIni" type="password" class="w-full" autocomplete="current-password" />
        </UFormField>

        <UFormField label="Password Baru">
          <UInput v-model="form.passwordBaru" type="password" class="w-full" autocomplete="new-password" />
        </UFormField>

        <div class="flex justify-end pt-2">
          <UButton type="submit" label="Simpan Perubahan" :loading="loading" />
        </div>
      </UForm>
    </UCard>
  </AppDashboardPanel>
</template>
