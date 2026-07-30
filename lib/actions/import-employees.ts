"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseCsv, CSV_HEADERS } from "@/lib/csv";
import { employeeSchema } from "@/lib/validations/employee";
import { auth } from "@/lib/auth";

export type ImportResult = {
  success: boolean;
  inserted: number;
  skipped: number;
  errors: { row: number; message: string }[];
};

/** Deteksi apakah baris header (case-insensitive). */
function isHeaderRow(cells: string[]): boolean {
  const lower = cells.map((c) => c.trim().toLowerCase());
  return CSV_HEADERS.every((h) => lower.includes(h));
}

/**
 * Import data karyawan dari teks CSV.
 * - Skip baris header jika ada.
 * - Validasi tiap baris pakai Zod.
 * - Insert per baris agar error unik (duplikat) tidak membatalkan batch.
 * - Mengembalikan ringkasan: inserted / skipped / errors.
 */
export async function importEmployees(csvText: string): Promise<ImportResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return {
      success: false,
      inserted: 0,
      skipped: 0,
      errors: [{ row: 0, message: "Hanya admin yang dapat mengimpor data" }],
    };
  }

  const rows = parseCsv(csvText);

  if (rows.length === 0) {
    return { success: false, inserted: 0, skipped: 0, errors: [{ row: 0, message: "File CSV kosong" }] };
  }

  let inserted = 0;
  let skipped = 0;
  const errors: ImportResult["errors"] = [];

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i];
    const rowNum = i + 1;

    if (isHeaderRow(cells)) {
      skipped++;
      continue;
    }

    if (cells.length < CSV_HEADERS.length) {
      errors.push({
        row: rowNum,
        message: `Kolom tidak lengkap (butuh ${CSV_HEADERS.length}, dapat ${cells.length})`,
      });
      skipped++;
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
      skipped++;
      continue;
    }

    const { phone, ...rest } = parsed.data;
    try {
      await prisma.employee.create({
        data: { ...rest, phone: phone || null },
      });
      inserted++;
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Gagal menyimpan";
      if (msg.includes("Unique constraint")) {
        errors.push({ row: rowNum, message: "NIP/email duplikat" });
      } else {
        errors.push({ row: rowNum, message: msg });
      }
      skipped++;
    }
  }

  revalidatePath("/employees");

  return {
    success: true,
    inserted,
    skipped,
    errors,
  };
}
