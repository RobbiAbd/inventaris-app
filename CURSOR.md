# CURSOR.md

> Panduan konteks proyek untuk AI assistant di Cursor.
> File ini dibaca otomatis sebagai instruksi proyek.

---

## Ringkasan Proyek

| Item | Keterangan |
|------|------------|
| **Nama Proyek** | Inventaris App |
| **Deskripsi** | Aplikasi Inventaris perusahaan mencatat barang yang ada di perusahaan seperti laptop, alat tulis dll. dan mencatat tanggal perbaikan dan tanggal pergantian. |
| **Target Pengguna** | HRD, Karyawan |
| **Status** | Development |

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Framework** | Nuxt 3 (Vue 3, Composition API) |
| **Bahasa** | TypeScript |
| **Styling** | Tailwind CSS + Nuxt UI |
| **Backend/API** | Nitro (server routes bawaan Nuxt) |
| **Database** | MySQL (via WAMP) |
| **ORM** | Prisma |
| **Validasi** | Zod |
| **Package Manager** | npm |
| **Runtime** | Node.js 20+ |

---

## Struktur Proyek

```
inventaris-pkl/
├── assets/                 # CSS, gambar, font global
├── components/             # Komponen Vue reusable
│   └── ui/                 # Komponen UI kecil (opsional)
├── composables/            # Logic reusable (useBarang, useAuth, dll.)
├── layouts/                # Layout halaman (default, auth, dll.)
├── middleware/             # Route guard (auth, role)
├── pages/                  # Routing otomatis berbasis file
│   ├── index.vue
│   ├── login.vue
│   └── barang/
│       ├── index.vue
│       └── [id].vue
├── plugins/                # Plugin Nuxt (client/server)
├── prisma/
│   └── schema.prisma       # Skema database
├── public/                 # File statis (favicon, logo)
├── server/
│   ├── api/                # REST API (Nitro handlers)
│   │   └── barang/
│   │       ├── index.get.ts
│   │       ├── index.post.ts
│   │       └── [id].put.ts
│   ├── middleware/         # Middleware server-side
│   └── utils/              # Helper server (db, auth)
├── types/                  # TypeScript types/interfaces
├── .env                    # Environment variables (jangan commit)
├── nuxt.config.ts
├── app.vue
├── package.json
├── .cursor/
│   └── rules/
└── CURSOR.md
```

**Penjelasan folder penting:**

- `pages/` — Setiap file `.vue` otomatis menjadi route
- `server/api/` — Endpoint backend; file `[nama].get.ts` → `GET /api/[nama]`
- `composables/` — Logic yang bisa dipakai ulang di komponen (`useFetch`, state, dll.)
- `components/` — Komponen UI; Nuxt auto-import tanpa perlu import manual
- `prisma/` — Definisi model database dan migrasi

---

## Cara Menjalankan Proyek

```bash
# Install dependensi
npm install

# Setup environment
cp .env.example .env

# Generate Prisma client & migrasi database
npx prisma generate
npx prisma migrate dev

# (Opsional) Seed data awal
npx prisma db seed

# Jalankan dev server
npm run dev

# Build production
npm run build
npm run preview
```

**URL lokal:** `http://localhost:3000`

---

## Konvensi Kode

### Umum

- Gunakan **TypeScript** untuk semua file baru (`.vue`, `.ts`)
- Gunakan **Composition API** dengan `<script setup lang="ts">`
- Gunakan bahasa **Indonesia** untuk label UI; **Inggris** untuk kode (variabel, fungsi, commit)
- Ikuti gaya penulisan yang sudah ada di file sekitarnya
- Minimalkan perubahan di luar scope permintaan
- Manfaatkan auto-import Nuxt; jangan import manual composable/komponen Nuxt bawaan

### Penamaan

| Tipe | Konvensi | Contoh |
|------|----------|--------|
| Komponen Vue | PascalCase | `BarangTable.vue` |
| Halaman | kebab-case | `pages/barang/[id].vue` |
| Composable | camelCase + prefix `use` | `useBarang.ts` |
| Server API | kebab-case + method suffix | `index.get.ts`, `[id].delete.ts` |
| Variabel & fungsi | camelCase | `namaBarang`, `getBarangById()` |
| Type/Interface | PascalCase | `Barang`, `CreateBarangInput` |
| Konstanta | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |
| Database table | snake_case plural | `barang_inventaris` |

### Format & Style

- Indentasi: 2 spasi
- Quote: single (`'`)
- Gunakan ESLint + Prettier bawaan proyek
- Akhiri file dengan newline

---

## Arsitektur & Pola

### Pola yang digunakan

- **File-based routing** — Route dari struktur `pages/`
- **Server API routes** — Backend di `server/api/` (Nitro)
- **Composables** — Business logic & data fetching di client
- **Prisma** — Akses database terpusat via `server/utils/db.ts`

### Alur request

```
Browser → pages/*.vue → composables/useXxx → $fetch('/api/...')
                                              ↓
                                    server/api/*.ts → Prisma → MySQL
```

### Aturan arsitektur

- **Pages** — Hanya orchestration UI; tidak ada query database langsung
- **Composables** — Data fetching, state, dan logic yang dipakai ulang
- **server/api/** — Validasi input, authorization, akses database
- **server/utils/** — Helper bersama (koneksi DB, auth, response formatter)
- **components/** — Presentational; terima props, emit events
- Jangan panggil Prisma dari `pages/` atau `components/`

---

## Database

| Item | Keterangan |
|------|------------|
| **Nama DB** | `inventaris_pkl` |
| **Engine** | InnoDB |
| **Charset** | utf8mb4 |

### Konvensi tabel

- Primary key: `id` (Int, auto increment)
- Timestamp: `createdAt`, `updatedAt` (Prisma `@updatedAt`)
- Soft delete (jika perlu): `deletedAt`
- Foreign key: `[model]Id` (camelCase di Prisma, snake_case di MySQL)

### Model utama

| Model | Fungsi |
|-------|--------|
| `User` | Data pengguna (HRD & Karyawan) |
| `Barang` | Data inventaris (laptop, alat tulis, dll.) |
| `RiwayatPerbaikan` | Catatan tanggal perbaikan barang |
| `RiwayatPergantian` | Catatan tanggal pergantian barang |

### Field penting `Barang`

- `nama`, `kategori`, `merk`, `nomorSeri`
- `status` — enum: `baik`, `rusak`, `dalam_perbaikan`, `diganti`
- `tanggalPembelian`, `lokasi`, `penanggungJawabId`

---

## Autentikasi & Otorisasi

- Metode login: Session-based via `nuxt-auth-utils` atau JWT di httpOnly cookie
- Role pengguna:
  - **HRD** — CRUD barang, kelola pengguna, lihat semua data
  - **Karyawan** — Lihat barang, ajukan laporan kerusakan
- Middleware route: `middleware/auth.ts`, `middleware/hrd.ts`
- Halaman publik: `/login`
- Halaman terproteksi: semua route selain `/login`

---

## API / Endpoint

| Method | Endpoint | Fungsi | Role |
|--------|----------|--------|------|
| POST | `/api/auth/login` | Login pengguna | Public |
| POST | `/api/auth/logout` | Logout | Auth |
| GET | `/api/barang` | Daftar barang (paginated) | Auth |
| GET | `/api/barang/:id` | Detail barang | Auth |
| POST | `/api/barang` | Tambah barang | HRD |
| PUT | `/api/barang/:id` | Update barang | HRD |
| DELETE | `/api/barang/:id` | Hapus barang | HRD |
| POST | `/api/barang/:id/perbaikan` | Catat perbaikan | HRD |
| POST | `/api/barang/:id/pergantian` | Catat pergantian | HRD |
| GET | `/api/users` | Daftar pengguna | HRD |

**Format response standar:**

```json
{
  "success": true,
  "message": "Data barang berhasil diambil",
  "data": {}
}
```

**Format error:**

```json
{
  "success": false,
  "message": "Barang tidak ditemukan",
  "errors": {}
}
```

---

## UI/UX

- **Framework UI:** Nuxt UI (komponen Tailwind siap pakai)
- **Bahasa UI:** Indonesia
- **Komponen reusable:** `components/` (mis. `BarangTable.vue`, `BarangForm.vue`)
- **Layout:** `layouts/default.vue` untuk halaman utama, `layouts/auth.vue` untuk login
- Ikuti layout dan warna yang sudah ada; jangan ubah desain tanpa diminta
- Gunakan `UButton`, `UTable`, `UInput`, `UModal` dari Nuxt UI sebelum buat komponen custom

---

## Testing

```bash
# Unit & component test
npm run test

# Test spesifik file
npx vitest run tests/barang.test.ts

# E2E (jika sudah disetup)
npm run test:e2e
```

- Framework test: **Vitest** + `@vue/test-utils`
- E2E (opsional): **Playwright**
- Test file disimpan di: `tests/` atau `__tests__/`
- Tulis test hanya jika diminta atau coverage benar-benar diperlukan

---

## Git & Workflow

### Branch

- `main` — production-ready
- `develop` — integrasi fitur
- `feature/nama-fitur` — fitur baru
- `fix/nama-bug` — perbaikan bug

### Commit message

Format: `[type]: deskripsi singkat`

| Type | Keterangan |
|------|------------|
| `feat` | Fitur baru |
| `fix` | Perbaikan bug |
| `refactor` | Refactor tanpa ubah behavior |
| `docs` | Dokumentasi |
| `test` | Test |
| `chore` | Maintenance |

Contoh: `feat: tambah halaman daftar barang inventaris`

---

## Hal yang BOLEH ✅

- Ikuti konvensi Nuxt 3 (auto-import, file-based routing, server routes)
- Reuse composables dan komponen yang sudah tersedia
- Gunakan `useFetch` / `$fetch` untuk data fetching
- Validasi input dengan Zod di server API
- Gunakan Prisma untuk semua query database
- Gunakan `<script setup lang="ts">` di semua komponen Vue

## Hal yang JANGAN ❌

- Jangan commit file sensitif (`.env`, kredensial, API key)
- Jangan hardcode password, token, atau secret
- Jangan akses database langsung dari `pages/` atau `components/`
- Jangan refactor besar tanpa diminta
- Jangan menambah dependency baru tanpa alasan jelas
- Jangan ubah skema Prisma tanpa konfirmasi
- Jangan push ke remote kecuali diminta
- Jangan gunakan Options API kecuali file legacy yang sudah ada

---

## Environment & Konfigurasi

File konfigurasi penting:

| File | Fungsi |
|------|--------|
| `.env` | Variabel environment (jangan commit) |
| `nuxt.config.ts` | Konfigurasi Nuxt (modules, runtimeConfig) |
| `prisma/schema.prisma` | Skema & koneksi database |

Variabel environment penting:

```env
DATABASE_URL="mysql://root:@localhost:3306/inventaris_pkl"
NUXT_SESSION_PASSWORD="[random-string-min-32-chars]"
NUXT_PUBLIC_APP_NAME="Inventaris App"
```

Akses di kode:

```ts
// Server-side
const config = useRuntimeConfig()
config.databaseUrl

// Client-side (hanya NUXT_PUBLIC_*)
const appName = useRuntimeConfig().public.appName
```

---

## Troubleshooting Umum

| Masalah | Solusi |
|---------|--------|
| Koneksi DB gagal | Cek `DATABASE_URL` di `.env` dan pastikan MySQL/WAMP berjalan |
| Prisma client error | Jalankan `npx prisma generate` |
| 404 pada API route | Pastikan file ada di `server/api/` dengan suffix method (`.get.ts`) |
| Auto-import tidak jalan | Restart dev server; cek `nuxt.config.ts` |
| Hydration mismatch | Pastikan data server & client konsisten; hindari `Date.now()` di template |
| Port 3000 sudah dipakai | Jalankan `npm run dev -- -p 3001` |

---

## Aturan Cursor Lanjutan (Opsional)

Untuk aturan spesifik per jenis file, buat file `.mdc` di `.cursor/rules/`:

```
.cursor/rules/
├── nuxt-vue.mdc            # Konvensi Vue/Nuxt components
├── server-api.mdc          # Aturan server routes & Prisma
└── prisma-database.mdc     # Aturan skema & migrasi
```

Contoh frontmatter:

```yaml
---
description: Standar penulisan komponen Vue dan composables Nuxt
globs: **/*.{vue,ts}
alwaysApply: false
---
```

---

## Referensi

- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Nuxt UI Components](https://ui.nuxt.com/components)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)

---

## Catatan Tambahan

### Aturan bisnis inventaris

- Setiap barang wajib punya: nama, kategori, status, dan penanggung jawab
- Tanggal perbaikan dicatat di `RiwayatPerbaikan` (satu barang bisa punya banyak riwayat)
- Tanggal pergantian dicatat saat barang diganti unit baru
- Status barang: `baik` → `rusak` → `dalam_perbaikan` → `baik` atau `diganti`

### Fitur yang direncanakan

- Dashboard ringkasan barang per kategori & status
- Export laporan inventaris (Excel/PDF)
- Notifikasi barang yang sudah lama tidak diperbaiki

---

*Terakhir diperbarui: 2026-06-02*
