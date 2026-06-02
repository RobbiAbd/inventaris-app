import PDFDocument from 'pdfkit'
import type { ReportTable } from '../../../shared/types/report'
import { formatReportDateTime } from './format'

export function buildPdfBuffer(table: ReportTable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const landscape = table.headers.length > 6
    const doc = new PDFDocument({
      margin: 36,
      size: 'A4',
      layout: landscape ? 'landscape' : 'portrait'
    })

    const chunks: Buffer[] = []
    doc.on('data', chunk => chunks.push(chunk as Buffer))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const left = doc.page.margins.left
    const right = doc.page.width - doc.page.margins.right
    const tableWidth = right - left
    const colWidth = tableWidth / table.headers.length
    const rowHeight = 18
    const fontSize = landscape ? 7 : 8

    let y = doc.page.margins.top

    doc.font('Helvetica-Bold').fontSize(14).text(table.title, left, y, {
      width: tableWidth,
      align: 'center'
    })
    y = doc.y + 6

    doc.font('Helvetica').fontSize(9).fillColor('#666666').text(
      `Dicetak: ${formatReportDateTime(new Date())} · Total ${table.rows.length} baris`,
      left,
      y,
      { width: tableWidth, align: 'center' }
    )
    y = doc.y + 14
    doc.fillColor('#000000')

    const drawHeader = () => {
      doc.font('Helvetica-Bold').fontSize(fontSize)
      table.headers.forEach((header, index) => {
        doc.text(header, left + index * colWidth + 2, y, {
          width: colWidth - 4,
          lineBreak: false
        })
      })
      y += rowHeight
      doc.moveTo(left, y - 4).lineTo(right, y - 4).strokeColor('#2563EB').lineWidth(1).stroke()
    }

    drawHeader()
    doc.font('Helvetica').fontSize(fontSize)

    for (const row of table.rows) {
      if (y > doc.page.height - doc.page.margins.bottom - rowHeight - 10) {
        doc.addPage({ layout: landscape ? 'landscape' : 'portrait', margin: 36 })
        y = doc.page.margins.top
        drawHeader()
        doc.font('Helvetica').fontSize(fontSize)
      }

      row.forEach((cell, index) => {
        doc.text(String(cell ?? '-'), left + index * colWidth + 2, y, {
          width: colWidth - 4,
          height: rowHeight,
          ellipsis: true,
          lineBreak: false
        })
      })
      y += rowHeight
    }

    doc.end()
  })
}
