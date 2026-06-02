import { prisma } from '../../utils/db'
import { requireHrd } from '../../utils/auth'
import { notDeleted } from '../../utils/softDelete'
import { successResponse } from '../../utils/response'
import type { DashboardStats } from '../../../shared/types/dashboard'

export default defineEventHandler(async (event) => {
  await requireHrd(event)

  const barangWhere = { ...notDeleted }

  const [
    totalBarang,
    totalVendor,
    totalUsers,
    barangAssigned,
    barangByStatus,
    barangByKategori,
    barangByTipePerolehan,
    vendorByJenis,
    usersByRole
  ] = await Promise.all([
    prisma.barang.count({ where: barangWhere }),
    prisma.vendor.count({ where: notDeleted }),
    prisma.user.count({ where: notDeleted }),
    prisma.barang.count({ where: { ...barangWhere, userId: { not: null } } }),
    prisma.barang.groupBy({
      by: ['status'],
      where: barangWhere,
      _count: { _all: true }
    }),
    prisma.barang.groupBy({
      by: ['kategori'],
      where: barangWhere,
      _count: { _all: true }
    }),
    prisma.barang.groupBy({
      by: ['tipePerolehan'],
      where: barangWhere,
      _count: { _all: true }
    }),
    prisma.vendor.groupBy({
      by: ['jenis'],
      where: notDeleted,
      _count: { _all: true }
    }),
    prisma.user.groupBy({
      by: ['role'],
      where: notDeleted,
      _count: { _all: true }
    })
  ])

  const data: DashboardStats = {
    totals: {
      barang: totalBarang,
      vendor: totalVendor,
      users: totalUsers,
      barangAssigned,
      barangUnassigned: totalBarang - barangAssigned
    },
    barangByStatus: barangByStatus.map(row => ({
      kode: row.status,
      count: row._count._all
    })),
    barangByKategori: barangByKategori.map(row => ({
      kode: row.kategori,
      count: row._count._all
    })),
    barangByTipePerolehan: barangByTipePerolehan.map(row => ({
      kode: row.tipePerolehan,
      count: row._count._all
    })),
    vendorByJenis: vendorByJenis.map(row => ({
      kode: row.jenis,
      count: row._count._all
    })),
    usersByRole: usersByRole.map(row => ({
      role: row.role,
      count: row._count._all
    }))
  }

  return successResponse('Statistik dashboard berhasil diambil', data)
})
