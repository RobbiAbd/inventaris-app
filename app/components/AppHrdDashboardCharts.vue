<script setup lang="ts">
import { Bar, Doughnut, Pie } from 'vue-chartjs'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from 'chart.js'
import type { DashboardStats } from '../../shared/types/dashboard'
import { roleLabels } from '../../shared/types/user'
import type { UserRole } from '../../shared/types/user'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement)

const props = defineProps<{
  stats: DashboardStats
}>()

const { labelFor, statusColor, MASTER_GROUPS } = useMasterOptions()

const palette = {
  primary: '#00C16A',
  primaryLight: '#75EDAE',
  info: '#3b82f6',
  warning: '#f59e0b',
  error: '#ef4444',
  neutral: '#94a3b8',
  violet: '#8b5cf6',
  teal: '#14b8a6'
}

const categoryColors = [palette.primary, palette.info, palette.warning, palette.violet, palette.teal, palette.error, palette.neutral]

function hexForStatus(kode: string) {
  const map: Record<string, string> = {
    success: palette.primary,
    error: palette.error,
    warning: palette.warning,
    info: palette.info,
    neutral: palette.neutral
  }
  return map[statusColor(kode)] ?? palette.neutral
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { boxWidth: 12, padding: 14 }
    }
  }
}

const barOptions = {
  ...chartOptions,
  scales: {
    y: {
      beginAtZero: true,
      ticks: { stepSize: 1 }
    }
  }
}

const statusChart = computed(() => ({
  labels: props.stats.barangByStatus.map(item => labelFor(MASTER_GROUPS.STATUS_BARANG, item.kode)),
  datasets: [{
    data: props.stats.barangByStatus.map(item => item.count),
    backgroundColor: props.stats.barangByStatus.map(item => hexForStatus(item.kode)),
    borderWidth: 0
  }]
}))

const kategoriChart = computed(() => ({
  labels: props.stats.barangByKategori.map(item => labelFor(MASTER_GROUPS.KATEGORI_BARANG, item.kode)),
  datasets: [{
    label: 'Jumlah',
    data: props.stats.barangByKategori.map(item => item.count),
    backgroundColor: props.stats.barangByKategori.map((_, index) => categoryColors[index % categoryColors.length]),
    borderRadius: 6
  }]
}))

const tipeChart = computed(() => ({
  labels: props.stats.barangByTipePerolehan.map(item => labelFor(MASTER_GROUPS.TIPE_PEROLEHAN, item.kode)),
  datasets: [{
    data: props.stats.barangByTipePerolehan.map(item => item.count),
    backgroundColor: [palette.primary, palette.info],
    borderWidth: 0
  }]
}))

const vendorChart = computed(() => ({
  labels: props.stats.vendorByJenis.map(item => labelFor(MASTER_GROUPS.JENIS_VENDOR, item.kode)),
  datasets: [{
    data: props.stats.vendorByJenis.map(item => item.count),
    backgroundColor: [palette.info, palette.violet, palette.teal, palette.neutral],
    borderWidth: 2,
    borderColor: '#ffffff'
  }]
}))

const usersChart = computed(() => ({
  labels: props.stats.usersByRole.map(item => roleLabels[item.role as UserRole] ?? item.role),
  datasets: [{
    data: props.stats.usersByRole.map(item => item.count),
    backgroundColor: [palette.primary, palette.neutral],
    borderWidth: 0
  }]
}))

const assignmentChart = computed(() => ({
  labels: ['Ditugaskan ke karyawan', 'Belum ditugaskan'],
  datasets: [{
    label: 'Barang',
    data: [props.stats.totals.barangAssigned, props.stats.totals.barangUnassigned],
    backgroundColor: [palette.primary, palette.warning],
    borderRadius: 6
  }]
}))
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-4 sm:grid-cols-3">
      <UCard>
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-package" class="size-7 text-primary" />
          <div>
            <p class="text-sm text-muted">Total Barang</p>
            <p class="text-xl font-bold">{{ stats.totals.barang }}</p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-building-2" class="size-7 text-info" />
          <div>
            <p class="text-sm text-muted">Total Vendor</p>
            <p class="text-xl font-bold">{{ stats.totals.vendor }}</p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-users" class="size-7 text-violet-500" />
          <div>
            <p class="text-sm text-muted">Total Pengguna</p>
            <p class="text-xl font-bold">{{ stats.totals.users }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <UCard>
        <template #header>
          <h3 class="font-semibold">Status Barang</h3>
        </template>
        <div class="h-72">
          <ClientOnly>
            <Doughnut :data="statusChart" :options="chartOptions" />
          </ClientOnly>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h3 class="font-semibold">Barang per Kategori</h3>
        </template>
        <div class="h-72">
          <ClientOnly>
            <Bar :data="kategoriChart" :options="barOptions" />
          </ClientOnly>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h3 class="font-semibold">Tipe Perolehan Barang</h3>
        </template>
        <div class="h-72">
          <ClientOnly>
            <Pie :data="tipeChart" :options="chartOptions" />
          </ClientOnly>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h3 class="font-semibold">Vendor per Jenis</h3>
        </template>
        <div class="h-72">
          <ClientOnly>
            <Pie :data="vendorChart" :options="chartOptions" />
          </ClientOnly>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h3 class="font-semibold">Pengguna per Role</h3>
        </template>
        <div class="h-72">
          <ClientOnly>
            <Doughnut :data="usersChart" :options="chartOptions" />
          </ClientOnly>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h3 class="font-semibold">Penugasan Barang ke Karyawan</h3>
        </template>
        <div class="h-72">
          <ClientOnly>
            <Bar :data="assignmentChart" :options="barOptions" />
          </ClientOnly>
        </div>
      </UCard>
    </div>
  </div>
</template>
