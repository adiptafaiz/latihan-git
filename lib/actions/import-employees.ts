"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseCsv, CSV_HEADERS } from "@/lib/csv";
import { employeeSchema } from "@/lib/validations/employee";
import { auth } from "@/lib/auth";

export type ImportResult = {
  success: boolean;
  totalProcessed: number;
  imported: number;
  skippedDuplicateNip: number;
  failed: number;
  errors: { row: number; message: string }[];
};

/** Deteksi apakah baris header (case-insensitive). */
function isHeaderRow(cells: string[]): boolean {
  const lowerCells = cells.map((c) => c.trim().toLowerCase());

  const expectedHeaders = CSV_HEADERS.map((h) => h.toLowerCase());

  return expectedHeaders.every((header) =>
    lowerCells.includes(header)
  );
}

/**
 * Import data karyawan dari teks CSV.
 * - Skip baris header jika ada.
 * - Validasi tiap baris pakai Zod.
 * - Cek NIP sebelum insert agar data karyawan tidak duplikat.
 * - Mengembalikan ringkasan: diproses / berhasil / duplikat / gagal.
 */
export async function importEmployees(csvText: string): Promise<ImportResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return {
      success: false,
      totalProcessed: 0,
      imported: 0,
      skippedDuplicateNip: 0,
      failed: 0,
      errors: [{ row: 0, message: "Hanya admin yang dapat mengimpor data" }],
    };
  }

  const rows = parseCsv(csvText);

  if (rows.length === 0) {
    return {
      success: false,
      totalProcessed: 0,
      imported: 0,
      skippedDuplicateNip: 0,
      failed: 0,
      errors: [{ row: 0, message: "File CSV kosong" }],
    };
  }

  let totalProcessed = 0;
  let imported = 0;
  let skippedDuplicateNip = 0;
  let failed = 0;
  const errors: ImportResult["errors"] = [];

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i];
    const rowNum = i + 1;

    if (isHeaderRow(cells)) {
      continue;
    }

    totalProcessed++;

    if (cells.length < CSV_HEADERS.length) {
      errors.push({
        row: rowNum,
        message: `Kolom tidak lengkap (butuh ${CSV_HEADERS.length}, dapat ${cells.length})`,
      });
      failed++;
      continue;
    }

    const obj: Record<string, string> = {};
    CSV_HEADERS.forEach((h, idx) => {
      obj[h] = cells[idx]?.trim() ?? "";
    });

    const parsed = employeeSchema.safeParse({
      nip: obj.nip,
      name: obj.name,
      email: obj.email,
      phone: obj.phone || undefined,
      position: obj.position,
      department: obj.department,
      joinDate: obj.joinDate, // Zod coerce.date
      status: obj.status || "ACTIVE",
    });

    if (!parsed.success) {
      const msg = Object.values(
        parsed.error.flatten().fieldErrors,
      )
        .flat()
        .join(", ");
      errors.push({ row: rowNum, message: msg });
      failed++;
      continue;
    }

    const { phone, ...rest } = parsed.data;
    try {
      const existingEmployee = await prisma.employee.findUnique({
        where: { nip: parsed.data.nip },
        select: { id: true },
      });

      if (existingEmployee) {
        skippedDuplicateNip++;
        continue;
      }

      await prisma.employee.create({
        data: { ...rest, phone: phone || null },
      });
      imported++;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        Array.isArray(e.meta?.target) &&
        e.meta.target.includes("nip")
      ) {
        skippedDuplicateNip++;
      } else {
        const msg = e instanceof Error ? e.message : "Gagal menyimpan";
        errors.push({ row: rowNum, message: msg });
        failed++;
      }
    }
  }

  revalidatePath("/employees");

  return {
    success: true,
    totalProcessed,
    imported,
    skippedDuplicateNip,
    failed,
    errors,
  };
}
