# Aplikasi Pendataan Karyawan

Aplikasi CRUD karyawan sederhana berbasis Next.js (App Router), Prisma, SQLite, dan Tailwind CSS. Implementasi mengikuti `IMPLEMENTASI-PENDATAAN-KARYAWAN.md`.

## Fitur (MVP)

- Tambah, lihat, ubah, hapus karyawan
- Pencarian (nama / NIP / email)
- Filter (departemen, status) + pagination
- Validasi form (Zod) di sisi server & client
- Penanganan error unik (NIP/email duplikat) dengan pesan ramah
- UI responsif berbasis shadcn/ui

## Stack

| Bagian | Teknologi |
|--------|-----------|
| Framework | Next.js 15 (App Router, RSC) |
| Bahasa | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (manual) |
| Validasi | Zod |
| ORM | Prisma |
| DB (dev) | SQLite |

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
components/
  ui/                     # primitives (button, input, table, ...)
  employees/              # form, table, filters, pagination, ...
lib/
  prisma.ts
  utils.ts
  validations/employee.ts
  actions/employee.ts     # Server Actions CRUD
prisma/
  schema.prisma
  seed.ts
```

## Setup Lokal

### Prasyarat
- Node.js 18.18+ (disarankan 20+)
- npm

### Langkah

```bash
# 1. Install dependencies
npm install

# 2. Migrasi database (membuat dev.db)
npx prisma migrate dev --name init

# 3. (Opsional) Seed data demo
npx prisma db seed

# 4. Jalankan dev server
npm run dev
```

Buka http://localhost:3000 → akan redirect ke `/employees`.

### Catatan SQLite & enum
SQLite tidak mendukung `enum` Prisma. Karena itu `status` disimpan sebagai `String`
dengan default `"ACTIVE"` dan divalidasi sebagai enum di layer aplikasi (Zod). Saat
migrasi ke PostgreSQL, boleh ubah ke `enum` native bila perlu.

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

## Alur Data

```
Form → useActionState → Server Action → Zod safeParse → Prisma → DB
                                              ↓ fail
                                       return { error } (field errors)
                          ↓ success
                  revalidatePath + redirect
```

## Deployment

1. Buat database PostgreSQL (Neon/Supabase/Railway).
2. Ubah `schema.prisma` → `provider = "postgresql"`.
3. Set `DATABASE_URL` di platform (Vercel).
4. Build command: `prisma generate && prisma migrate deploy && next build`.
5. **Wajib** tambahkan autentikasi sebelum expose publik (MVP belum punya auth).

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
