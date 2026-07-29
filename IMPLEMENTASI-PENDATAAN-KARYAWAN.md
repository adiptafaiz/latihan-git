# Breakdown Implementasi: Aplikasi Pendataan Karyawan (Next.js)

Dokumen ini merinci analisis, rekomendasi arsitektur, model data, struktur kode, tahapan pengembangan, dan checklist implementasi untuk aplikasi pendataan karyawan sederhana berbasis Next.js.

---

## 1. Ringkasan Proyek

| Item | Detail |
|------|--------|
| **Nama** | Aplikasi Pendataan Karyawan |
| **Tujuan** | CRUD data karyawan: tambah, lihat, ubah, hapus, cari, dan filter |
| **Target pengguna** | Admin HR / staf internal |
| **Skala** | Sederhana (MVP → expandable) |
| **Stack utama** | Next.js 15, TypeScript, Prisma, SQLite/PostgreSQL, Tailwind, shadcn/ui |

### 1.1 Ruang Lingkup MVP

**Masuk scope:**
- Create, Read, Update, Delete karyawan
- Daftar karyawan dengan tabel
- Pencarian (nama, NIP, email)
- Filter (departemen, status)
- Validasi form (client + server)
- Feedback sukses/error

**Di luar scope MVP (fase lanjutan):**
- Autentikasi & otorisasi multi-role
- Upload foto karyawan
- Export CSV/PDF
- Histori perubahan (audit log)
- Integrasi payroll / absensi
- Multi-cabang / multi-tenant

---

## 2. Analisis Kebutuhan

### 2.1 Functional Requirements

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-01 | Admin dapat menambah data karyawan baru | Must |
| FR-02 | Admin dapat melihat daftar seluruh karyawan | Must |
| FR-03 | Admin dapat melihat detail satu karyawan | Must |
| FR-04 | Admin dapat mengubah data karyawan | Must |
| FR-05 | Admin dapat menghapus data karyawan | Must |
| FR-06 | Admin dapat mencari karyawan by nama/NIP/email | Must |
| FR-07 | Admin dapat filter by departemen & status | Should |
| FR-08 | Sistem menolak NIP/email duplikat | Must |
| FR-09 | Form menampilkan error validasi yang jelas | Must |
| FR-10 | Pagination daftar karyawan | Should |
| FR-11 | Login admin | Could (fase 4) |
| FR-12 | Export data ke CSV | Could (fase 4) |

### 2.2 Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Type-safety end-to-end | TypeScript strict |
| NFR-02 | Validasi input server-side | Zod di Server Actions |
| NFR-03 | UI responsif | Mobile + desktop |
| NFR-04 | Setup lokal cepat | < 15 menit cold start |
| NFR-05 | Deploy mudah | Vercel-ready |
| NFR-06 | Migrasi DB aman | Prisma Migrate |

### 2.3 Entitas & Atribut

**Employee (Karyawan)**

| Field | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | String (CUID) | PK | Auto-generate |
| `nip` | String | Unique, required | Nomor Induk Pegawai |
| `name` | String | Required, min 2 | Nama lengkap |
| `email` | String | Unique, email format | Email kerja |
| `phone` | String? | Optional | No. telepon |
| `position` | String | Required | Jabatan |
| `department` | String | Required | Departemen |
| `joinDate` | DateTime | Required | Tanggal bergabung |
| `status` | Enum | Default `ACTIVE` | `ACTIVE` \| `INACTIVE` |
| `createdAt` | DateTime | Auto | Timestamp buat |
| `updatedAt` | DateTime | Auto | Timestamp ubah |

**Catatan desain:**
- `department` & `position` disimpan sebagai string di MVP (bukan relasi). Bisa dinormalisasi ke tabel terpisah di fase lanjutan.
- Soft-delete tidak dipakai di MVP; hard-delete cukup. Soft-delete bisa ditambahkan via field `deletedAt` nanti.
- Gaji, alamat, foto, gender, dll. ditunda sampai requirement jelas.

---

## 3. Rekomendasi Arsitektur

### 3.1 Stack Teknologi

```
┌─────────────────────────────────────────────────────┐
│                    PRESENTATION                      │
│  Next.js App Router · React Server Components       │
│  Tailwind CSS · shadcn/ui · Lucide Icons            │
├─────────────────────────────────────────────────────┤
│                   APPLICATION                        │
│  Server Actions · Zod Validation · revalidatePath   │
├─────────────────────────────────────────────────────┤
│                      DATA                            │
│  Prisma ORM · SQLite (dev) / PostgreSQL (prod)      │
└─────────────────────────────────────────────────────┘
```

| Layer | Pilihan | Alasan |
|-------|---------|--------|
| Framework | **Next.js 15 (App Router)** | Full-stack dalam satu repo, RSC, routing file-based |
| Bahasa | **TypeScript** | Type safety, DX bagus dengan Prisma |
| Styling | **Tailwind CSS + shadcn/ui** | Cepat, konsisten, komponen siap pakai |
| Validasi | **Zod** | Schema shareable client/server, infer TypeScript |
| ORM | **Prisma** | Schema-first, migrate, type-safe queries |
| DB dev | **SQLite** | Zero-config, file lokal |
| DB prod | **PostgreSQL** (Neon/Supabase) | Reliable, Vercel-compatible |
| Mutasi data | **Server Actions** | Tidak perlu API REST terpisah untuk CRUD form |
| Auth (nanti) | **Auth.js (NextAuth v5)** | Integrasi native Next.js |

### 3.2 Mengapa Bukan Alternatif Lain

| Alternatif | Alasan ditunda/ditolak untuk MVP |
|------------|----------------------------------|
| Pages Router | App Router lebih modern & default create-next-app |
| REST API + fetch client | Overhead; Server Actions cukup untuk form CRUD |
| MongoDB / Mongoose | Data karyawan relasional; Prisma+SQL lebih cocok |
| Redux / Zustand | State server di-handle RSC; client state minimal |
| Express/Nest terpisah | Over-engineering untuk app sederhana |
| Drizzle | Prisma lebih ramah untuk pemula; DX migrasi matang |

### 3.3 Pola Alur Data

```
┌──────────┐   submit    ┌──────────────┐  safeParse  ┌─────┐
│  Form UI │ ──────────► │ Server Action │ ──────────► │ Zod │
└──────────┘             └──────┬───────┘             └──┬──┘
                                │                        │
                     success ───┤              fail ─────┘
                                ▼                   return { error }
                         ┌────────────┐
                         │   Prisma   │
                         └─────┬──────┘
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
              create/update  P2002     other err
                    │       (unique)      │
                    ▼          ▼          ▼
            revalidatePath   map error  throw/return
            redirect/list    ke user
```

**Prinsip:**
1. Validasi **selalu** di server (Zod), client hanya UX.
2. Mutasi lewat Server Actions, bukan raw fetch ke route handler (kecuali butuh API publik).
3. Setelah mutasi: `revalidatePath` agar list/detail fresh.
4. Error Prisma unique → pesan ramah ("NIP sudah terdaftar").

---

## 4. Struktur Proyek

```
employee-app/
├── app/
│   ├── layout.tsx                 # Root layout (nav, font, providers)
│   ├── page.tsx                   # Redirect → /employees
│   ├── globals.css
│   └── (dashboard)/
│       ├── layout.tsx             # Sidebar / topnav dashboard
│       └── employees/
│           ├── page.tsx           # List + search + filter + pagination
│           ├── loading.tsx        # Skeleton loading
│           ├── new/
│           │   └── page.tsx       # Form create
│           └── [id]/
│               ├── page.tsx       # Detail karyawan
│               ├── not-found.tsx
│               └── edit/
│                   └── page.tsx   # Form edit
├── components/
│   ├── ui/                        # shadcn primitives (button, input, table, ...)
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   └── page-header.tsx
│   └── employees/
│       ├── employee-table.tsx
│       ├── employee-form.tsx
│       ├── employee-filters.tsx
│       ├── employee-status-badge.tsx
│       └── delete-employee-button.tsx
├── lib/
│   ├── prisma.ts                  # Singleton PrismaClient
│   ├── utils.ts                   # cn(), formatDate, dll.
│   ├── validations/
│   │   └── employee.ts            # Zod schemas + types
│   └── actions/
│       └── employee.ts            # Server Actions CRUD
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── next.config.ts
├── components.json                # shadcn config
└── README.md
```

### 4.1 Tanggung Jawab File Kunci

| File | Tanggung jawab |
|------|----------------|
| `lib/validations/employee.ts` | Schema Zod create/update, type `EmployeeInput` |
| `lib/actions/employee.ts` | `createEmployee`, `updateEmployee`, `deleteEmployee`, `getEmployees`, `getEmployeeById` |
| `lib/prisma.ts` | Inisialisasi Prisma client (hindari multi-instance di dev) |
| `components/employees/employee-form.tsx` | Form shared create & edit |
| `components/employees/employee-table.tsx` | Tabel list + aksi row |
| `app/(dashboard)/employees/page.tsx` | Orchestrate list: baca `searchParams`, panggil query, render |

---

## 5. Desain Data (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite" // ganti ke "postgresql" di production
  url      = env("DATABASE_URL")
}

enum EmployeeStatus {
  ACTIVE
  INACTIVE
}

model Employee {
  id         String         @id @default(cuid())
  nip        String         @unique
  name       String
  email      String         @unique
  phone      String?
  position   String
  department String
  joinDate   DateTime
  status     EmployeeStatus @default(ACTIVE)
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt

  @@index([department])
  @@index([status])
  @@index([name])
}
```

### 5.1 Environment

```env
# .env
DATABASE_URL="file:./dev.db"

# Production example:
# DATABASE_URL="postgresql://user:pass@host:5432/employee_db?sslmode=require"
```

### 5.2 Seed Data (contoh)

```ts
// prisma/seed.ts
import { PrismaClient, EmployeeStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.employee.createMany({
    data: [
      {
        nip: "EMP001",
        name: "Budi Santoso",
        email: "budi@perusahaan.com",
        phone: "081234567890",
        position: "Software Engineer",
        department: "Engineering",
        joinDate: new Date("2023-01-15"),
        status: EmployeeStatus.ACTIVE,
      },
      {
        nip: "EMP002",
        name: "Siti Aminah",
        email: "siti@perusahaan.com",
        phone: "081298765432",
        position: "HR Officer",
        department: "Human Resources",
        joinDate: new Date("2022-06-01"),
        status: EmployeeStatus.ACTIVE,
      },
      {
        nip: "EMP003",
        name: "Andi Wijaya",
        email: "andi@perusahaan.com",
        position: "Finance Staff",
        department: "Finance",
        joinDate: new Date("2021-03-20"),
        status: EmployeeStatus.INACTIVE,
      },
    ],
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

---

## 6. Validasi (Zod)

```ts
// lib/validations/employee.ts
import { z } from "zod";

export const employeeStatusEnum = z.enum(["ACTIVE", "INACTIVE"]);

export const employeeSchema = z.object({
  nip: z
    .string()
    .min(1, "NIP wajib diisi")
    .max(30, "NIP maksimal 30 karakter")
    .regex(/^[A-Za-z0-9\-]+$/, "NIP hanya huruf, angka, dan strip"),
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  email: z.string().email("Format email tidak valid"),
  phone: z
    .string()
    .max(20)
    .optional()
    .or(z.literal("")),
  position: z.string().min(1, "Jabatan wajib diisi").max(80),
  department: z.string().min(1, "Departemen wajib diisi").max(80),
  joinDate: z.coerce.date({
    required_error: "Tanggal bergabung wajib diisi",
    invalid_type_error: "Tanggal tidak valid",
  }),
  status: employeeStatusEnum.default("ACTIVE"),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;

/** Schema update: sama, id datang dari params route */
export const updateEmployeeSchema = employeeSchema;
```

**Konstanta referensi departemen (UI select):**

```ts
export const DEPARTMENTS = [
  "Engineering",
  "Human Resources",
  "Finance",
  "Marketing",
  "Operations",
  "Sales",
] as const;
```

---

## 7. Server Actions (Spesifikasi)

File: `lib/actions/employee.ts`

### 7.1 Kontrak Fungsi

| Fungsi | Input | Output sukses | Output gagal |
|--------|-------|---------------|--------------|
| `createEmployee` | `FormData` atau object | `redirect('/employees')` | `{ error: FieldErrors \| string }` |
| `updateEmployee` | `id` + data | `redirect(/employees/${id})` | `{ error: ... }` |
| `deleteEmployee` | `id: string` | `revalidatePath` + redirect list | `{ error: string }` |
| `getEmployees` | `{ q?, department?, status?, page?, pageSize? }` | `{ data, total, page, pageSize }` | throw |
| `getEmployeeById` | `id: string` | `Employee \| null` | throw |

### 7.2 Pseudocode Implementasi

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { employeeSchema } from "@/lib/validations/employee";

export async function createEmployee(raw: unknown) {
  const parsed = employeeSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = {
    ...parsed.data,
    phone: parsed.data.phone || null,
  };

  try {
    await prisma.employee.create({ data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const target = (e.meta?.target as string[]) ?? [];
      if (target.includes("nip")) return { error: { nip: ["NIP sudah terdaftar"] } };
      if (target.includes("email")) return { error: { email: ["Email sudah terdaftar"] } };
      return { error: "Data duplikat" };
    }
    throw e;
  }

  revalidatePath("/employees");
  redirect("/employees");
}

export async function updateEmployee(id: string, raw: unknown) {
  const parsed = employeeSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.employee.update({
      where: { id },
      data: {
        ...parsed.data,
        phone: parsed.data.phone || null,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return { error: "Karyawan tidak ditemukan" };
      if (e.code === "P2002") {
        const target = (e.meta?.target as string[]) ?? [];
        if (target.includes("nip")) return { error: { nip: ["NIP sudah terdaftar"] } };
        if (target.includes("email")) return { error: { email: ["Email sudah terdaftar"] } };
      }
    }
    throw e;
  }

  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  redirect(`/employees/${id}`);
}

export async function deleteEmployee(id: string) {
  try {
    await prisma.employee.delete({ where: { id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return { error: "Karyawan tidak ditemukan" };
    }
    throw e;
  }

  revalidatePath("/employees");
  redirect("/employees");
}

export async function getEmployees(params: {
  q?: string;
  department?: string;
  status?: "ACTIVE" | "INACTIVE";
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 10));
  const q = params.q?.trim();

  const where: Prisma.EmployeeWhereInput = {
    AND: [
      q
        ? {
            OR: [
              { name: { contains: q } },
              { nip: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : {},
      params.department ? { department: params.department } : {},
      params.status ? { status: params.status } : {},
    ],
  };

  const [data, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.employee.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getEmployeeById(id: string) {
  return prisma.employee.findUnique({ where: { id } });
}
```

> **Catatan SQLite:** `contains` di SQLite case-sensitive tergantung collation. Untuk case-insensitive, normalisasi ke lowercase di app layer atau upgrade ke PostgreSQL di prod (`mode: "insensitive"`).

---

## 8. Desain UI / Halaman

### 8.1 Peta Rute

| Route | Metode data | UI |
|-------|-------------|-----|
| `/` | — | Redirect ke `/employees` |
| `/employees` | `getEmployees(searchParams)` | Header + filter + table + pagination |
| `/employees/new` | — | Form kosong (mode create) |
| `/employees/[id]` | `getEmployeeById` | Kartu detail + tombol Edit/Hapus |
| `/employees/[id]/edit` | `getEmployeeById` | Form terisi (mode edit) |

### 8.2 Wireframe Logis

**List (`/employees`)**
```
┌─────────────────────────────────────────────────────────┐
│  Karyawan                          [+ Tambah Karyawan]  │
├─────────────────────────────────────────────────────────┤
│  [🔍 Cari nama/NIP/email ]  [Dept ▼] [Status ▼] [Cari] │
├─────────────────────────────────────────────────────────┤
│  NIP   │ Nama        │ Dept        │ Jabatan │ Status │…│
│  EMP001│ Budi ...    │ Engineering │ SE      │ Active │…│
│  EMP002│ Siti ...    │ HR          │ Officer │ Active │…│
├─────────────────────────────────────────────────────────┤
│  Menampilkan 1–10 dari 23          [← Prev] [Next →]   │
└─────────────────────────────────────────────────────────┘
```

**Form create/edit**
```
┌──────────────────────────────────────┐
│  Tambah / Edit Karyawan              │
│  NIP*        [____________]          │
│  Nama*       [____________]          │
│  Email*      [____________]          │
│  Telepon     [____________]          │
│  Jabatan*    [____________]          │
│  Departemen* [Select    ▼ ]          │
│  Tgl Gabung* [date picker ]          │
│  Status*     (•) Active ( ) Inactive │
│                                      │
│  [Batal]              [Simpan]       │
└──────────────────────────────────────┘
```

### 8.3 Komponen UI (shadcn)

Install minimal:
```bash
npx shadcn@latest add button input label select table badge
npx shadcn@latest add card dialog alert-dialog sonner separator
npx shadcn@latest add dropdown-menu
```

| Komponen | Dipakai di |
|----------|------------|
| `Button` | Aksi utama, secondary, destructive |
| `Input` + `Label` | Field form |
| `Select` | Departemen, status filter |
| `Table` | Daftar karyawan |
| `Badge` | Status ACTIVE/INACTIVE |
| `Card` | Detail karyawan |
| `AlertDialog` | Konfirmasi hapus |
| `Sonner` (toast) | Notifikasi sukses/error client |

### 8.4 State UI

| State | Perilaku |
|-------|----------|
| Loading list | `loading.tsx` skeleton table |
| Empty result | Ilustrasi + CTA "Tambah karyawan" |
| Not found detail | `not-found.tsx` + link kembali |
| Validasi form | Inline error per field |
| Hapus | Dialog konfirmasi sebelum action |
| Duplikat NIP/email | Error di field terkait |

---

## 9. Tahapan Pengembangan

### Fase 0 — Project Bootstrap
**Estimasi:** 0.5 hari  
**Tujuan:** Repo Next.js siap, DB connected, tooling jalan.

| # | Task | Kriteria selesai |
|---|------|------------------|
| 0.1 | `npx create-next-app@latest employee-app` (TS, Tailwind, App Router, ESLint) | `npm run dev` hijau |
| 0.2 | Init shadcn: `npx shadcn@latest init` | `components.json` ada |
| 0.3 | Install dep: `prisma`, `@prisma/client`, `zod` | package.json ter-update |
| 0.4 | `npx prisma init --datasource-provider sqlite` | schema + `.env` |
| 0.5 | Tulis model `Employee` + enum | schema valid |
| 0.6 | `npx prisma migrate dev --name init` | `dev.db` terbuat |
| 0.7 | `lib/prisma.ts` singleton | import tanpa error |
| 0.8 | `.env.example` + update `.gitignore` | aman untuk commit |
| 0.9 | Bersihkan boilerplate page | layout dasar |

**Command ringkas:**
```bash
npx create-next-app@latest employee-app --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*"
cd employee-app
npx shadcn@latest init
npm install zod
npm install prisma @prisma/client --save-exact
npx prisma init --datasource-provider sqlite
# edit schema →
npx prisma migrate dev --name init
```

---

### Fase 1 — CRUD Inti
**Estimasi:** 1–2 hari  
**Tujuan:** Semua operasi CRUD jalan end-to-end.

| # | Task | File utama | Kriteria selesai |
|---|------|------------|------------------|
| 1.1 | Zod schema | `lib/validations/employee.ts` | Type `EmployeeInput` ter-infer |
| 1.2 | Server Actions CRUD | `lib/actions/employee.ts` | Create/update/delete/get tested |
| 1.3 | Komponen `EmployeeForm` | `components/employees/employee-form.tsx` | Bisa create & edit (prop `initialData?`) |
| 1.4 | Halaman create | `app/.../employees/new/page.tsx` | Submit → row baru di DB |
| 1.5 | Halaman list (tanpa filter dulu) | `app/.../employees/page.tsx` | Semua karyawan tampil |
| 1.6 | `EmployeeTable` | `components/employees/employee-table.tsx` | Kolom NIP, nama, dept, status, aksi |
| 1.7 | Halaman detail | `app/.../employees/[id]/page.tsx` | Data lengkap + not-found |
| 1.8 | Halaman edit | `app/.../employees/[id]/edit/page.tsx` | Prefill + update sukses |
| 1.9 | Tombol hapus + konfirmasi | `delete-employee-button.tsx` | Row hilang dari list |
| 1.10 | Handle P2002 unique | actions | Pesan "NIP/email sudah terdaftar" |

**Definition of Done Fase 1:**
- [ ] Bisa create karyawan valid
- [ ] Bisa lihat list & detail
- [ ] Bisa edit & simpan perubahan
- [ ] Bisa hapus dengan konfirmasi
- [ ] NIP/email duplikat ditolak dengan pesan jelas
- [ ] Field wajib divalidasi

---

### Fase 2 — Search, Filter, Pagination
**Estimasi:** 0.5–1 hari  
**Tujuan:** List usable untuk data > 10 rows.

| # | Task | Kriteria selesai |
|---|------|------------------|
| 2.1 | Baca `searchParams` di list page (`q`, `department`, `status`, `page`) | URL mencerminkan state filter |
| 2.2 | Extend `getEmployees` dengan where + skip/take | Query benar |
| 2.3 | Komponen `EmployeeFilters` (controlled via form GET) | Submit update URL |
| 2.4 | Pagination controls | Prev/Next + info total |
| 2.5 | Empty state saat hasil 0 | Copy + clear filter |
| 2.6 | `loading.tsx` skeleton | Tidak blank saat navigasi |

**Pola filter via URL (disarankan):**
```
/employees?q=budi&department=Engineering&status=ACTIVE&page=1
```
Form filter method `GET` → progressive enhancement, shareable URL, back-button friendly.

---

### Fase 3 — Polish UX & Kualitas
**Estimasi:** 0.5 hari

| # | Task | Kriteria selesai |
|---|------|------------------|
| 3.1 | Layout dashboard (sidebar/topnav) | Navigasi konsisten |
| 3.2 | Format tanggal `id-ID` | `15 Januari 2023` |
| 3.3 | Badge status warna (hijau/abu) | Visual jelas |
| 3.4 | Toast sukses (opsional client wrapper) | Feedback non-intrusif |
| 3.5 | Responsive: table scroll di mobile | Usable di HP |
| 3.6 | Seed script + `prisma db seed` | Data demo 5–10 rows |
| 3.7 | README cara setup lokal | Orang lain bisa clone & run |
| 3.8 | ESLint bersih, no `any` liar | `npm run lint` pass |

---

### Fase 4 — Lanjutan (Opsional)

| Fitur | Pendekatan singkat | Estimasi |
|-------|--------------------|----------|
| **Auth admin** | Auth.js credentials atau magic link; proteksi route `(dashboard)` via middleware | 1–2 hari |
| **Export CSV** | Server Action generate CSV dari `findMany` + download response | 0.5 hari |
| **Upload foto** | Uploadthing / S3; field `photoUrl` di model | 1 hari |
| **Master departemen** | Model `Department` + relasi FK; select dari DB | 0.5–1 hari |
| **Soft delete** | Field `deletedAt`; default where `deletedAt: null` | 0.5 hari |
| **Audit log** | Model `EmployeeLog` di-trigger dari actions | 1 hari |
| **Deploy** | Vercel + Neon Postgres; ganti provider Prisma | 0.5 hari |

---

## 10. Checklist Implementasi per File

Gunakan sebagai progress tracker saat coding.

### Setup
- [ ] `package.json` — dependencies lengkap
- [ ] `prisma/schema.prisma` — model Employee
- [ ] `.env` / `.env.example`
- [ ] `lib/prisma.ts`
- [ ] `lib/utils.ts`

### Domain
- [ ] `lib/validations/employee.ts`
- [ ] `lib/actions/employee.ts`
- [ ] `prisma/seed.ts`

### Components
- [ ] `components/employees/employee-form.tsx`
- [ ] `components/employees/employee-table.tsx`
- [ ] `components/employees/employee-filters.tsx`
- [ ] `components/employees/employee-status-badge.tsx`
- [ ] `components/employees/delete-employee-button.tsx`
- [ ] `components/layout/sidebar.tsx` (atau topnav)
- [ ] `components/layout/page-header.tsx`

### Routes
- [ ] `app/layout.tsx`
- [ ] `app/page.tsx` (redirect)
- [ ] `app/(dashboard)/layout.tsx`
- [ ] `app/(dashboard)/employees/page.tsx`
- [ ] `app/(dashboard)/employees/loading.tsx`
- [ ] `app/(dashboard)/employees/new/page.tsx`
- [ ] `app/(dashboard)/employees/[id]/page.tsx`
- [ ] `app/(dashboard)/employees/[id]/not-found.tsx`
- [ ] `app/(dashboard)/employees/[id]/edit/page.tsx`

### Docs & QA
- [ ] `README.md`
- [ ] Manual test script (lihat §12)
- [ ] Lint & typecheck pass

---

## 11. Keputusan Teknis & Trade-off

| Keputusan | Pilihan | Trade-off |
|-----------|---------|-----------|
| Mutasi data | Server Actions | Pro: simpel. Kontra: kurang cocok jika nanti butuh public API mobile — tambah Route Handlers saat perlu |
| DB dev | SQLite | Pro: cepat. Kontra: fitur full-text/insensitive limited — prod pakai Postgres |
| Department | String field | Pro: zero join. Kontra: tipografi tidak konsisten — normalisasi nanti |
| Hapus | Hard delete | Pro: simpel. Kontra: data hilang permanen — soft delete di fase 4 jika butuh |
| Auth | Ditunda | Pro: fokus CRUD dulu. Kontra: endpoint terbuka di local/demo — wajib sebelum production |
| Form state | useActionState / uncontrolled + FormData | Hindari form library berat di MVP; react-hook-form bisa ditambah jika form membesar |
| Pagination | Offset (skip/take) | Cukup untuk data kecil–menengah; cursor-based jika >10k rows |

---

## 12. Rencana Pengujian Manual

### 12.1 Happy Path
1. Buka `/employees` → list kosong atau seed data.
2. Klik **Tambah** → isi form valid → Simpan → muncul di list.
3. Klik row/detail → data sesuai.
4. Edit salah satu field → Simpan → detail ter-update.
5. Hapus → konfirmasi → hilang dari list.

### 12.2 Validasi & Error
| Kasus | Hasil diharapkan |
|-------|------------------|
| Submit form kosong | Error per field wajib |
| Email `bukan-email` | Error format email |
| NIP duplikat | Error "NIP sudah terdaftar" |
| Email duplikat | Error "Email sudah terdaftar" |
| ID detail tidak ada | Halaman not-found |
| Search `xyzabc` | Empty state |
| Filter status INACTIVE | Hanya karyawan nonaktif |

### 12.3 UX
- [ ] Loading tidak flicker aneh
- [ ] Mobile: form & table usable
- [ ] Tombol hapus tidak langsung eksekusi tanpa dialog
- [ ] Setelah create, user mendarat di list (atau detail — konsistenkan)

---

## 13. Keamanan (Baseline MVP)

| Area | Tindakan |
|------|----------|
| Input | Zod di server; jangan percaya client |
| XSS | React escape default; jangan `dangerouslySetInnerHTML` untuk data user |
| SQL Injection | Prisma parameterized (default aman) |
| Mass assignment | Hanya field yang ada di Zod schema yang di-pass ke Prisma |
| Secrets | `.env` di `.gitignore`; jangan commit `dev.db` jika berisi data sensitif |
| Production | **Wajib** auth + HTTPS + Postgres sebelum expose publik |
| CSRF | Server Actions Next.js punya origin check built-in |
| Rate limit | Belum perlu MVP lokal; pertimbangkan di edge/middleware saat public |

---

## 14. Deploy (Fase Produksi)

### 14.1 Langkah Umum
1. Buat database PostgreSQL (Neon / Supabase / Railway).
2. Ubah `schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Set `DATABASE_URL` di Vercel project settings.
4. Build command: `prisma generate && prisma migrate deploy && next build`
5. Deploy ke Vercel.
6. (Opsional) Jalankan seed sekali via script terproteksi.

### 14.2 Checklist Pre-Production
- [ ] Auth aktif
- [ ] `DATABASE_URL` production terpasang
- [ ] Migrate deploy sukses
- [ ] Tidak ada secret di client bundle
- [ ] Error monitoring (opsional: Sentry)
- [ ] Backup DB plan

---

## 15. Estimasi Total & Urutan Kerja

```
Fase 0 ████░░░░░░  0.5 hari   Bootstrap
Fase 1 ████████░░  1–2 hari   CRUD
Fase 2 ████░░░░░░  0.5–1 hari Search/filter
Fase 3 ███░░░░░░░  0.5 hari   Polish
─────────────────────────────
MVP total          ~3–4 hari  (1 developer full-time)

Fase 4 ░░░░░░░░░░  +2–5 hari  Auth, export, deploy, dsb.
```

**Urutan coding harian yang disarankan:**

| Hari | Fokus |
|------|-------|
| Hari 1 pagi | Fase 0 + schema + prisma client |
| Hari 1 sore | Zod + actions create/get + form create + list kasar |
| Hari 2 pagi | Detail, edit, delete + unique error |
| Hari 2 sore | Filter, search, pagination |
| Hari 3 | Layout, seed, README, bugfix, responsive |

---

## 16. Risiko Proyek

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Scope creep (gaji, cuti, absensi) | Molor | Kunci MVP ke CRUD karyawan saja |
| SQLite quirks di search | UX search aneh | Dokumentasikan; pindah Postgres saat perlu |
| Lupa validasi server | Data kotor / bug | Semua mutasi lewat Zod |
| Deploy tanpa auth | Data bocor | Gate production di Fase 4 auth |
| Form terlalu kompleks di awal | Lambat | Satu form shared create/edit, field minimal |

---

## 17. Glosarium

| Istilah | Arti di dokumen ini |
|---------|---------------------|
| **MVP** | Minimum Viable Product — versi paling kecil yang berguna |
| **Server Action** | Fungsi server Next.js dipanggil langsung dari form/UI |
| **RSC** | React Server Component — render di server, zero bundle client default |
| **revalidatePath** | Invalidasi cache halaman setelah mutasi data |
| **P2002** | Kode error Prisma untuk unique constraint violation |
| **shadcn/ui** | Koleksi komponen copy-paste berbasis Radix + Tailwind |

---

## 18. Referensi Cepat Command

```bash
# Dev
npm run dev

# Prisma
npx prisma migrate dev --name <nama>
npx prisma generate
npx prisma studio          # GUI data
npx prisma db seed

# Quality
npm run lint
npx tsc --noEmit

# shadcn
npx shadcn@latest add <component>
```

---

## 19. Kesimpulan & Next Step

Aplikasi pendataan karyawan paling efektif dibangun sebagai **CRUD full-stack Next.js** dengan:

1. **Prisma + SQLite** untuk velocity development  
2. **Server Actions + Zod** untuk mutasi aman tanpa API layer berlebih  
3. **shadcn/ui** untuk UI rapi cepat  
4. **Pengembangan bertahap**: Bootstrap → CRUD → Search/Filter → Polish → (Auth/Deploy)

**Langkah langsung setelah dokumen ini:**
1. Jalankan Fase 0 (scaffold project)  
2. Implement schema + actions (Fase 1.1–1.2)  
3. Bangun form & list sampai DoD Fase 1 terpenuhi  

---

*Dokumen ini adalah living document — perbarui saat keputusan arsitektur berubah (mis. menambah relasi Department, auth, atau soft delete).*
