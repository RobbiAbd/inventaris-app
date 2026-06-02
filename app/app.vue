<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'id'
  }
})

const appName = useRuntimeConfig().public.appName

useSeoMeta({
  title: appName,
  description: 'Aplikasi inventaris perusahaan untuk mencatat barang, perbaikan, dan pergantian.'
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
