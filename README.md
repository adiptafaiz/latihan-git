# Aplikasi Pendataan Karyawan

Aplikasi CRUD karyawan sederhana berbasis Next.js (App Router), Prisma, SQLite, dan Tailwind CSS. Implementasi mengikuti `IMPLEMENTASI-PENDATAAN-KARYAWAN.md`.

## Fitur (MVP)

- Tambah, lihat, ubah, hapus karyawan
- Pencarian (nama / NIP / email)
- Filter (departemen, status) + pagination
- Validasi form (Zod) di sisi server & client
- Penanganan error unik (NIP/email duplikat) dengan pesan ramah
- UI responsif berbasis shadcn/ui
- **Export data karyawan ke CSV** (`GET /api/employees/export`)
- **Import data karyawan dari CSV** (validasi per-baris, skip duplikat, ringkasan inserted/skipped)

## Stack

| Bagian | Teknologi |
|--------|-----------|
| Framework | Next.js 15 (App Router, RSC) |
| Bahasa | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (manual) |
| Validasi | Zod |
| ORM | Prisma |
| DB | PostgreSQL |

## Struktur

```
app/
  (dashboard)/
    employees/
      page.tsx            # list + filter + pagination
      loading.tsx
      new/page.tsx        # form create
      [id]/
        page.tsx          # detail
        not-found.tsx
        edit/page.tsx     # form edit
api/
  employees/export/route.ts  # export CSV
components/
  ui/                      # primitives (button, input, table, ...)
  employees/              # form, table, filters, pagination, import, ...
lib/
  prisma.ts
  utils.ts
  csv.ts                  # parser & serializer CSV
  validations/employee.ts
  actions/employee.ts     # Server Actions CRUD
  actions/import-employees.ts  # import CSV
prisma/
  schema.prisma
  seed.ts
```

## Setup Lokal

### Prasyarat
- Node.js 18.18+ (disarankan 20+)
- npm

### Langkah

1. **Siapkan database PostgreSQL** lokal (atau cloud: Neon/Supabase/Railway).
2. **Salin `.env`** dari `.env.example` lalu isi `DATABASE_URL` sesuai kredensial Anda:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pendataan_karyawan?schema=public"
   ```
   Pastikan database `pendataan_karyawan` sudah dibuat (create database manual di Postgres Anda).
3. **Install & migrate:**
   ```bash
   npm install
   npx prisma migrate dev --name init
   ```
4. **(Opsional) Seed data demo:**
   ```bash
   npx prisma db seed
   ```
5. **Jalankan dev server:**
   ```bash
   npm run dev
   ```

Buka http://localhost:3000 → akan redirect ke `/login` (autentikasi admin).

**Akun demo** (otomatis dibuat saat seed):

| Role | Email | Password | Akses |
|---|---|---|---|
| Admin | `admin@perusahaan.com` | `admin123` | Akses penuh, termasuk import dan hapus. |
| Staff | `staff@perusahaan.com` | `staff123` | Lihat, tambah, ubah, dan export karyawan. |

### Catatan PostgreSQL
- `status` disimpan sebagai `String` (default `"ACTIVE"`) untuk migrasi minimal
  dari SQLite; divalidasi sebagai enum di layer aplikasi (Zod). Bisa ditingkatkan
  ke `enum` native Postgres bila perlu.
- Pencarian (`contains`) memakai `mode: "insensitive"` agar case-insensitive.

## Skrip npm

| Skrip | Fungsi |
|-------|--------|
| `npm run dev` | Dev server |
| `npm run build` | Build produksi (jalankan `prisma generate` dulu) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Type check TypeScript |
| `npm run db:migrate` | Migrasi |
| `npm run db:seed` | Isi data demo |
| `npm run db:studio` | Prisma Studio (GUI data) |

## Import / Export CSV

**Export:** tombol "Export CSV" di halaman daftar, atau akses langsung
`GET /api/employees/export`. Mengunduh `karyawan-YYYY-MM-DD.csv` berisi seluruh
karyawan dengan header: `nip,name,email,phone,position,department,joinDate,status`.

**Import:** tombol "Import" di halaman daftar. Format CSV sama dengan output
export (header wajib ada di baris pertama, atau boleh di-skip otomatis).
- Validasi per-baris pakai Zod.
- Baris invalid / duplikat di-skip, tidak membatalkan batch.
- Hasil: jumlah ditambahkan vs dilewati + daftar baris bermasalah.
- Tombol "Unduh template" menyediakan file contoh.

Format tanggal: `YYYY-MM-DD`. Status: `ACTIVE` atau `INACTIVE`.

## Alur Data

```
Form → useActionState → Server Action → Zod safeParse → Prisma → DB
                                              ↓ fail
                                       return { error } (field errors)
                          ↓ success
                  revalidatePath + redirect
```

## Deployment

1. Buat database PostgreSQL (Neon/Supabase/Railway) — atau pakai yang sama dengan dev.
2. Set `DATABASE_URL` di platform (Vercel).
3. Build command: `prisma generate && prisma migrate deploy && next build`.
4. **Wajib** tambahkan autentikasi sebelum expose publik (MVP belum punya auth).

## Pengujian Manual (ringkas)

| Kasus | Hasil diharapkan |
|-------|------------------|
| Tambah karyawan valid | Muncul di list |
| Submit form kosong | Error per field |
| NIP/email duplikat | Pesan "sudah terdaftar" |
| Hapus dengan konfirmasi | Row hilang |
| Cari kata kunci | Hanya hasil cocok |
| Filter status Tidak Aktif | Hanya nonaktif |
| ID tidak ada | Halaman not-found |
