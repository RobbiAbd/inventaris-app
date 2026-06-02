import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcrypt'
import { MASTER_GROUPS } from '../shared/types/master'

const prisma = new PrismaClient()

const masterSeed = [
  // jenis_vendor
  { group: MASTER_GROUPS.JENIS_VENDOR, kode: 'GALON', label: 'Galon / Air Minum', sortOrder: 1 },
  { group: MASTER_GROUPS.JENIS_VENDOR, kode: 'KENDARAAN', label: 'Kendaraan', sortOrder: 2 },
  { group: MASTER_GROUPS.JENIS_VENDOR, kode: 'SUPIR', label: 'Supir / Jasa Sopir', sortOrder: 3 },
  { group: MASTER_GROUPS.JENIS_VENDOR, kode: 'LAINNYA', label: 'Lainnya', sortOrder: 99 },
  // tipe_perolehan
  { group: MASTER_GROUPS.TIPE_PEROLEHAN, kode: 'BELI', label: 'Beli (Milik Perusahaan)', sortOrder: 1 },
  { group: MASTER_GROUPS.TIPE_PEROLEHAN, kode: 'SEWA', label: 'Sewa (Vendor)', sortOrder: 2 },
  // status_barang
  { group: MASTER_GROUPS.STATUS_BARANG, kode: 'BAIK', label: 'Baik', sortOrder: 1, config: { color: 'success' } },
  { group: MASTER_GROUPS.STATUS_BARANG, kode: 'RUSAK', label: 'Rusak', sortOrder: 2, config: { color: 'error' } },
  { group: MASTER_GROUPS.STATUS_BARANG, kode: 'DALAM_PERBAIKAN', label: 'Dalam Perbaikan', sortOrder: 3, config: { color: 'warning' } },
  { group: MASTER_GROUPS.STATUS_BARANG, kode: 'DIGANTI', label: 'Diganti', sortOrder: 4, config: { color: 'neutral' } },
  // kategori_barang
  { group: MASTER_GROUPS.KATEGORI_BARANG, kode: 'LAPTOP', label: 'Laptop', sortOrder: 1, config: { wajibAssignUser: true } },
  { group: MASTER_GROUPS.KATEGORI_BARANG, kode: 'ALAT_TULIS', label: 'Alat Tulis', sortOrder: 2, config: {} },
  { group: MASTER_GROUPS.KATEGORI_BARANG, kode: 'FURNITURE', label: 'Furniture', sortOrder: 3, config: {} },
  { group: MASTER_GROUPS.KATEGORI_BARANG, kode: 'ELEKTRONIK', label: 'Elektronik', sortOrder: 4, config: { wajibAssignUser: true } },
  { group: MASTER_GROUPS.KATEGORI_BARANG, kode: 'KENDARAAN', label: 'Kendaraan', sortOrder: 5, config: { wajibAssignUser: true, jenisVendorKode: 'KENDARAAN' } },
  { group: MASTER_GROUPS.KATEGORI_BARANG, kode: 'GALON', label: 'Galon', sortOrder: 6, config: { wajibSewa: true, jenisVendorKode: 'GALON' } },
  { group: MASTER_GROUPS.KATEGORI_BARANG, kode: 'SUPIR', label: 'Supir / Jasa', sortOrder: 7, config: { wajibSewa: true, jenisVendorKode: 'SUPIR' } },
  { group: MASTER_GROUPS.KATEGORI_BARANG, kode: 'LAINNYA', label: 'Lainnya', sortOrder: 99, config: {} }
]

const users = [
  { nama: 'Admin HRD', email: 'hrd@inventaris.local', password: 'password123', role: Role.HRD },
  { nama: 'Karyawan Demo', email: 'karyawan@inventaris.local', password: 'password123', role: Role.KARYAWAN }
]

async function main() {
  for (const item of masterSeed) {
    await prisma.masterOption.upsert({
      where: { group_kode: { group: item.group, kode: item.kode } },
      update: {
        label: item.label,
        sortOrder: item.sortOrder,
        config: item.config ?? undefined,
        isActive: true
      },
      create: {
        group: item.group,
        kode: item.kode,
        label: item.label,
        sortOrder: item.sortOrder,
        config: item.config ?? undefined,
        isActive: true
      }
    })
  }

  const seededUsers: Record<string, number> = {}
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10)
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: { nama: user.nama, password: hashedPassword, role: user.role },
      create: { ...user, password: hashedPassword }
    })
    seededUsers[user.email] = record.id
  }

  const vendors = [
    { nama: 'Aqua Galon Delivery', jenis: 'GALON', kontak: 'Budi', telepon: '081234567890', email: 'galon@aqua.local' },
    { nama: 'CV Rental Mobil Jaya', jenis: 'KENDARAAN', kontak: 'Siti', telepon: '081987654321', email: 'rental@jaya.local' },
    { nama: 'PT Sopir Profesional', jenis: 'SUPIR', kontak: 'Agus', telepon: '081112223333', email: 'supir@prof.local' }
  ]

  const seededVendors: Record<string, number> = {}
  for (const vendor of vendors) {
    const existing = await prisma.vendor.findFirst({ where: { nama: vendor.nama } })
    const record = existing
      ? await prisma.vendor.update({ where: { id: existing.id }, data: vendor })
      : await prisma.vendor.create({ data: vendor })
    seededVendors[vendor.nama] = record.id
  }

  const barangSamples = [
    { nama: 'Laptop Dell Latitude', kategori: 'LAPTOP', merk: 'Dell', nomorSeri: 'DL-LAT-001', status: 'BAIK', tipePerolehan: 'BELI', lokasi: 'Ruang HRD', harga: 12500000, tanggalPembelian: new Date('2023-01-15'), userId: seededUsers['hrd@inventaris.local'] },
    { nama: 'Printer Canon', kategori: 'ELEKTRONIK', merk: 'Canon', nomorSeri: 'CN-PR-002', status: 'DALAM_PERBAIKAN', tipePerolehan: 'BELI', lokasi: 'Ruang Admin', harga: 3500000, tanggalPembelian: new Date('2022-06-10'), userId: seededUsers['karyawan@inventaris.local'] },
    { nama: 'Galon Isi Ulang 19L', kategori: 'GALON', merk: 'Aqua', status: 'BAIK', tipePerolehan: 'SEWA', lokasi: 'Pantry', tanggalMulaiSewa: new Date('2024-01-01'), vendorId: seededVendors['Aqua Galon Delivery'] },
    { nama: 'Supir Dinar', kategori: 'SUPIR', status: 'BAIK', tipePerolehan: 'SEWA', lokasi: 'Operasional', tanggalMulaiSewa: new Date('2024-06-01'), vendorId: seededVendors['PT Sopir Profesional'] },
    { nama: 'Mobil Dinas Avanza', kategori: 'KENDARAAN', merk: 'Toyota', nomorSeri: 'B 1234 XYZ', status: 'BAIK', tipePerolehan: 'SEWA', lokasi: 'Parkir', tanggalMulaiSewa: new Date('2024-03-01'), tanggalAkhirSewa: new Date('2025-03-01'), vendorId: seededVendors['CV Rental Mobil Jaya'], userId: seededUsers['hrd@inventaris.local'] },
    { nama: 'Meja Kerja', kategori: 'FURNITURE', merk: 'Informa', nomorSeri: 'FN-MK-003', status: 'BAIK', tipePerolehan: 'BELI', lokasi: 'Open Space', harga: 1800000, tanggalPembelian: new Date('2021-03-20') }
  ]

  for (const sample of barangSamples) {
    if (sample.nomorSeri) {
      await prisma.barang.upsert({
        where: { nomorSeri: sample.nomorSeri },
        update: sample,
        create: sample
      })
    } else {
      const existing = await prisma.barang.findFirst({ where: { nama: sample.nama, kategori: sample.kategori } })
      if (existing) {
        await prisma.barang.update({ where: { id: existing.id }, data: sample })
      } else {
        await prisma.barang.create({ data: sample })
      }
    }
  }

  console.log('Seed selesai: master data, user, vendor & barang')
}

main().catch(console.error).finally(() => prisma.$disconnect())
