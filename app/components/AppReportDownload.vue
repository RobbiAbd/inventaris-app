<script setup lang="ts">
import type { ReportFilters, ReportFormat, ReportType } from '../../shared/types/report'

const props = defineProps<{
  reportType: ReportType
  filters?: ReportFilters
}>()

const toast = useToast()
const { downloadReport, exporting } = useReportExport()

const menuItems = computed(() => [[
  {
    label: 'Download Excel (.xlsx)',
    icon: 'i-lucide-file-spreadsheet',
    onSelect: () => handleDownload('xlsx')
  },
  {
    label: 'Download PDF',
    icon: 'i-lucide-file-text',
    onSelect: () => handleDownload('pdf')
  }
]])

async function handleDownload(format: ReportFormat) {
  try {
    await downloadReport(props.reportType, format, props.filters ?? {})
    toast.add({
      title: 'Berhasil',
      description: `Laporan ${format.toUpperCase()} sedang diunduh`,
      color: 'success'
    })
  } catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string }, statusMessage?: string }
    toast.add({
      title: 'Gagal mengunduh laporan',
      description: fetchError.data?.statusMessage ?? fetchError.statusMessage ?? 'Terjadi kesalahan',
      color: 'error'
    })
  }
}
</script>

<template>
  <UDropdownMenu
    :items="menuItems"
    :content="{ align: 'end' }"
  >
    <UButton
      label="Download"
      icon="i-lucide-download"
      color="neutral"
      variant="outline"
      :loading="exporting"
      trailing-icon="i-lucide-chevron-down"
    />
  </UDropdownMenu>
</template>
