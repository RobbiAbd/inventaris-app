import type { ReportFilters, ReportFormat, ReportType } from '../../shared/types/report'
import { REPORT_TYPE_LABELS } from '../../shared/types/report'

function buildExportQuery(format: ReportFormat, filters: ReportFilters) {
  const query: Record<string, string> = { format }

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      query[key] = value
    }
  }

  return query
}

function extensionForFormat(format: ReportFormat) {
  return format === 'pdf' ? 'pdf' : 'xlsx'
}

export function useReportExport() {
  const exporting = ref(false)

  async function downloadReport(
    type: ReportType,
    format: ReportFormat,
    filters: ReportFilters = {}
  ) {
    exporting.value = true

    try {
      const blob = await $fetch<Blob>(`/api/reports/${type}/export`, {
        query: buildExportQuery(format, filters),
        responseType: 'blob'
      })

      const stamp = new Date().toISOString().slice(0, 10)
      const slug = REPORT_TYPE_LABELS[type]
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${slug}-${stamp}.${extensionForFormat(format)}`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      exporting.value = false
    }
  }

  return {
    exporting,
    downloadReport
  }
}
