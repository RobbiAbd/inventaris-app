import ExcelJS from 'exceljs'
import type { ReportTable } from '../../../shared/types/report'
import { formatReportDateTime } from './format'

export async function buildExcelBuffer(table: ReportTable) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Inventaris App'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(table.sheetName)

  sheet.mergeCells(1, 1, 1, table.headers.length)
  sheet.getCell(1, 1).value = table.title
  sheet.getCell(1, 1).font = { bold: true, size: 14 }

  sheet.mergeCells(2, 1, 2, table.headers.length)
  sheet.getCell(2, 1).value = `Dicetak: ${formatReportDateTime(new Date())}`
  sheet.getCell(2, 1).font = { size: 10, color: { argb: 'FF666666' } }

  sheet.addRow([])

  const headerRow = sheet.addRow(table.headers)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  })

  table.rows.forEach((row) => {
    const dataRow = sheet.addRow(row)
    dataRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      }
      cell.alignment = { vertical: 'top', wrapText: true }
    })
  })

  sheet.columns.forEach((column) => {
    let maxLength = 10
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const value = cell.value?.toString() ?? ''
      maxLength = Math.max(maxLength, Math.min(value.length + 2, 40))
    })
    column.width = maxLength
  })

  sheet.views = [{ state: 'frozen', ySplit: 4 }]

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
