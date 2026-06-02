<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

useSeoMeta({
  title: 'Login - Inventaris App'
})

const { login } = useAuth()
const toast = useToast()
const loading = ref(false)

const fields = [
  {
    name: 'email',
    type: 'text' as const,
    label: 'Email',
    placeholder: 'nama@perusahaan.com',
    required: true
  },
  {
    name: 'password',
    type: 'password' as const,
    label: 'Password',
    placeholder: 'Masukkan password',
    required: true
  }
]

async function onSubmit(event: FormSubmitEvent<{ email: string, password: string }>) {
  loading.value = true

  try {
    await login(event.data.email, event.data.password)
    toast.add({
      title: 'Login berhasil',
      description: 'Selamat datang di Inventaris App',
      color: 'success'
    })
    await navigateTo('/')
  } catch (error: unknown) {
    const fetchError = error as {
      data?: { message?: string, statusMessage?: string }
      statusMessage?: string
    }

    const message
      = fetchError.data?.statusMessage
        ?? fetchError.data?.message
        ?? fetchError.statusMessage
        ?? 'Email atau password salah'

    toast.add({
      title: 'Login gagal',
      description: message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="w-full max-w-md">
    <div class="text-center mb-6">
      <UIcon name="i-lucide-package" class="size-10 text-primary mx-auto mb-3" />
      <h1 class="text-2xl font-bold">Inventaris App</h1>
      <p class="text-muted text-sm mt-1">Masuk ke akun Anda</p>
    </div>

    <UAuthForm
      :fields="fields"
      :loading="loading"
      submit-label="Masuk"
      @submit="onSubmit"
    />

    <div class="mt-6 p-4 rounded-lg bg-muted/50 text-xs text-muted space-y-1">
      <p class="font-medium text-default">Akun demo:</p>
      <p>HRD — hrd@inventaris.local / password123</p>
      <p>Karyawan — karyawan@inventaris.local / password123</p>
    </div>
  </UCard>
</template>
