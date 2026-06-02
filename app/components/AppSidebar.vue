<script setup lang="ts">
const { user, logout } = useAuth()
const appName = useRuntimeConfig().public.appName

const isHrd = computed(() => user.value?.role === 'HRD')

const menuItems = computed(() => {
  const overview = [
    { label: 'Utama', type: 'label' as const },
    {
      label: 'Dashboard',
      icon: 'i-lucide-layout-dashboard',
      to: '/'
    }
  ]

  const inventaris = [
    { label: 'Inventaris', type: 'label' as const },
    {
      label: 'Daftar Barang',
      icon: 'i-lucide-package',
      to: '/barang'
    },
    {
      label: 'Riwayat',
      icon: 'i-lucide-history',
      to: '/riwayat'
    }
  ]

  const groups = [overview, inventaris]

  if (isHrd.value) {
    groups.push([
      { label: 'Administrasi', type: 'label' as const },
      {
        label: 'Tambah Barang',
        icon: 'i-lucide-plus-circle',
        to: '/barang/tambah'
      },
      {
        label: 'Vendor',
        icon: 'i-lucide-building-2',
        to: '/vendor'
      },
      {
        label: 'Tambah Vendor',
        icon: 'i-lucide-user-plus',
        to: '/vendor/tambah'
      },
      {
        label: 'Pengguna',
        icon: 'i-lucide-users',
        to: '/pengguna'
      },
      {
        label: 'Master Data',
        icon: 'i-lucide-settings',
        to: '/pengaturan/master-data'
      }
    ])
  }

  return groups
})
</script>

<template>
  <UDashboardSidebar
    id="main-sidebar"
    collapsible
    resizable
  >
    <template #header="{ collapsed }">
      <NuxtLink to="/" class="flex items-center gap-2 px-1">
        <UIcon name="i-lucide-package" class="size-6 text-primary shrink-0" />
        <span v-if="!collapsed" class="font-semibold truncate">{{ appName }}</span>
      </NuxtLink>
    </template>

    <UNavigationMenu
      :items="menuItems"
      orientation="vertical"
      :ui="{ link: 'w-full' }"
    />

    <template #footer="{ collapsed }">
      <div class="flex flex-col gap-2 w-full">
        <UColorModeButton
          color="neutral"
          variant="ghost"
          block
          :square="collapsed"
        />
        <div v-if="!collapsed" class="px-2 py-2 rounded-lg bg-muted/50">
          <p class="text-sm font-medium truncate">{{ user?.nama }}</p>
          <p class="text-xs text-muted truncate">{{ user?.role }}</p>
        </div>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-log-out"
          :label="collapsed ? undefined : 'Keluar'"
          block
          @click="logout"
        />
      </div>
    </template>
  </UDashboardSidebar>
</template>
