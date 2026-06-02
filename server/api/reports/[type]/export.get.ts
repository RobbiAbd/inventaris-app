import {
  REPORT_FORMATS,
  REPORT_TYPE_LABELS,
  REPORT_TYPES
} from '../../../../shared/types/report'
import type { ReportFilters, ReportFormat, ReportType } from '../../../../shared/types/report'
import { buildReportTable } from '../../../utils/report/data'
import { buildExcelBuffer } from '../../../utils/report/excel'
import { buildPdfBuffer } from '../../../utils/report/pdf'
import { reportFileStamp, sanitizeFilename } from '../../../utils/report/format'

const VALID_TYPES = Object.values(REPORT_TYPES)

function parseFilters(query: Record<string, unknown>): ReportFilters {
  return {
    search: (query.search as string)?.trim() || undefined,
    kategori: (query.kategori as string)?.trim() || undefined,
    status: (query.status as string)?.trim() || undefined,
    jenis: (query.jenis as string)?.trim() || undefined,
    role: (query.role as string)?.trim() || undefined,
    entityType: (query.entityType as string)?.trim() || undefined
  }
}

export default defineEventHandler(async (event) => {
  const type = getRouterParam(event, 'type') as ReportType
  const query = getQuery(event)
  const format = ((query.format as string)?.toLowerCase() ?? 'xlsx') as ReportFormat

  if (!VALID_TYPES.includes(type)) {
    throw createError({ statusCode: 404, statusMessage: 'Jenis laporan tidak ditemukan' })
  }

  if (!REPORT_FORMATS.includes(format)) {
    throw createError({ statusCode: 400, statusMessage: 'Format laporan harus xlsx atau pdf' })
  }

  const table = await buildReportTable(event, type, parseFilters(query))
  const stamp = reportFileStamp()
  const baseName = sanitizeFilename(REPORT_TYPE_LABELS[type])

  if (format === 'pdf') {
    const buffer = await buildPdfBuffer(table)
    setHeader(event, 'Content-Type', 'application/pdf')
    setHeader(event, 'Content-Disposition', `attachment; filename="${baseName}-${stamp}.pdf"`)
    return buffer
  }

  const buffer = await buildExcelBuffer(table)
  setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  setHeader(event, 'Content-Disposition', `attachment; filename="${baseName}-${stamp}.xlsx"`)
  return buffer
})
