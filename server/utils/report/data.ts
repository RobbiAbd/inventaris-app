import type { Prisma, Role } from '@prisma/client'
import type { ReportFilters, ReportType } from '../../../shared/types/report'
import { REPORT_TYPES } from '../../../shared/types/report'
import { ENTITY_TYPE_LABELS, ACTION_LABELS } from '../../../shared/types/history'
import type { EntityType } from '../../../shared/types/history'
import { roleLabels } from '../../../shared/types/user'
import type { UserRole } from '../../../shared/types/user'
import { getMasterLabel, MASTER_GROUPS } from '../../../shared/types/master'
import { prisma } from '../db'
import { barangScopeForUser, requireHrd, requireSession } from '../auth'
import { barangInclude, serializeBarang } from '../barang'
import { serializeVendor } from '../vendor'
import { serializeUser } from '../user'
import { serializeActivityLog } from '../history'
import { activeBarangCountSelect, notDeleted } from '../softDelete'
import { getMasterOptionsMap } from '../master'
import { formatReportDate, formatReportDateTime } from './format'

const MAX_ROWS = 5000

type SessionUser = { id: number, role: string }

export async function buildReportTable(
  event: Parameters<typeof requireSession>[0],
  type: ReportType,
  filters: ReportFilters
) {
  const user = await requireSession(event)
  const masterMap = await getMasterOptionsMap(true)

  if (type === REPORT_TYPES.BARANG) {
    return buildBarangTable(user, filters, masterMap)
  }

  if (type === REPORT_TYPES.RIWAYAT) {
    return buildRiwayatTable(filters)
  }

  await requireHrd(event)

  if (type === REPORT_TYPES.VENDOR) {
    return buildVendorTable(filters, masterMap)
  }

  if (type === REPORT_TYPES.PENGGUNA) {
    return buildPenggunaTable(filters)
  }

  throw createError({ statusCode: 400, statusMessage: 'Jenis laporan tidak valid' })
}

async function buildBarangTable(
  user: SessionUser,
  filters: ReportFilters,
  masterMap: Awaited<ReturnType<typeof getMasterOptionsMap>>
) {
  const where: Prisma.BarangWhereInput = {
    ...notDeleted,
    ...barangScopeForUser(user),
    ...(filters.search && {
      OR: [
        { nama: { contains: filters.search } },
        { kategori: { contains: filters.search } },
        { merk: { contains: filters.search } },
        { nomorSeri: { contains: filters.search } },
        { lokasi: { contains: filters.search } }
      ]
    }),
    ...(filters.kategori && { kategori: filters.kategori }),
    ...(filters.status && { status: filters.status })
  }

  const items = await prisma.barang.findMany({
    where,
    include: barangInclude,
    orderBy: { updatedAt: 'desc' },
    take: MAX_ROWS
  })

  const rows = items.map((item, index) => {
    const barang = serializeBarang(item)
    return [
      String(index + 1),
      barang.nama,
      getMasterLabel(masterMap[MASTER_GROUPS.KATEGORI_BARANG], barang.kategori),
      barang.merk ?? '-',
      barang.nomorSeri ?? '-',
      getMasterLabel(masterMap[MASTER_GROUPS.STATUS_BARANG], barang.status),
      getMasterLabel(masterMap[MASTER_GROUPS.TIPE_PEROLEHAN], barang.tipePerolehan),
      barang.lokasi ?? '-',
      barang.vendor?.nama ?? '-',
      barang.user?.nama ?? '-',
      formatReportDate(barang.tanggalPembelian ?? barang.tanggalMulaiSewa),
      formatReportDateTime(barang.updatedAt)
    ]
  })

  return {
    title: 'Laporan Inventaris Barang',
    sheetName: 'Barang',
    headers: [
      'No',
      'Nama',
      'Kategori',
      'Merk',
      'Nomor Seri',
      'Status',
      'Perolehan',
      'Lokasi',
      'Vendor',
      'Ditugaskan ke',
      'Tgl Pembelian/Sewa',
      'Diperbarui'
    ],
    rows
  }
}

async function buildVendorTable(
  filters: ReportFilters,
  masterMap: Awaited<ReturnType<typeof getMasterOptionsMap>>
) {
  const where: Prisma.VendorWhereInput = {
    ...notDeleted,
    ...(filters.jenis && { jenis: filters.jenis }),
    ...(filters.search && {
      OR: [
        { nama: { contains: filters.search } },
        { kontak: { contains: filters.search } },
        { telepon: { contains: filters.search } },
        { email: { contains: filters.search } }
      ]
    })
  }

  const items = await prisma.vendor.findMany({
    where,
    include: { _count: { select: activeBarangCountSelect } },
    orderBy: { nama: 'asc' },
    take: MAX_ROWS
  })

  const rows = items.map((item, index) => {
    const vendor = serializeVendor(item)
    return [
      String(index + 1),
      vendor.nama,
      getMasterLabel(masterMap[MASTER_GROUPS.JENIS_VENDOR], vendor.jenis),
      vendor.kontak ?? '-',
      vendor.telepon ?? '-',
      vendor.email ?? '-',
      vendor.alamat ?? '-',
      String(vendor._count?.barang ?? 0)
    ]
  })

  return {
    title: 'Laporan Vendor',
    sheetName: 'Vendor',
    headers: ['No', 'Nama', 'Jenis', 'Kontak', 'Telepon', 'Email', 'Alamat', 'Barang Terhubung'],
    rows
  }
}

async function buildPenggunaTable(filters: ReportFilters) {
  const where: Prisma.UserWhereInput = {
    ...notDeleted,
    ...(filters.role && { role: filters.role as Role }),
    ...(filters.search && {
      OR: [
        { nama: { contains: filters.search } },
        { email: { contains: filters.search } }
      ]
    })
  }

  const items = await prisma.user.findMany({
    where,
    select: {
      id: true,
      nama: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: activeBarangCountSelect }
    },
    orderBy: { nama: 'asc' },
    take: MAX_ROWS
  })

  const rows = items.map((item, index) => {
    const user = serializeUser(item)
    return [
      String(index + 1),
      user.nama,
      user.email,
      roleLabels[user.role as UserRole],
      String(user._count?.barang ?? 0),
      formatReportDateTime(user.createdAt)
    ]
  })

  return {
    title: 'Laporan Pengguna',
    sheetName: 'Pengguna',
    headers: ['No', 'Nama', 'Email', 'Role', 'Barang Ditugaskan', 'Terdaftar'],
    rows
  }
}

async function buildRiwayatTable(filters: ReportFilters) {
  const where: Prisma.ActivityLogWhereInput = {
    ...(filters.entityType && { entityType: filters.entityType as EntityType })
  }

  const items = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: MAX_ROWS
  })

  const rows = items.map((item, index) => {
    const log = serializeActivityLog(item)
    return [
      String(index + 1),
      formatReportDateTime(log.createdAt),
      ACTION_LABELS[log.action],
      ENTITY_TYPE_LABELS[log.entityType],
      log.summary,
      log.entityLabel,
      log.actorNama ?? 'Sistem'
    ]
  })

  return {
    title: 'Laporan Riwayat Aktivitas',
    sheetName: 'Riwayat',
    headers: ['No', 'Tanggal', 'Aksi', 'Jenis Data', 'Ringkasan', 'Entitas', 'Oleh'],
    rows
  }
}
