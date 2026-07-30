import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { escapeCsv, CSV_HEADERS } from "@/lib/csv";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** GET /api/employees/export → unduh CSV seluruh karyawan. */
export async function GET() {
  const employees = await prisma.employee.findMany({
    orderBy: { createdAt: "desc" },
  });

  const header = CSV_HEADERS.map((h) => escapeCsv(h)).join(",");
  const lines = employees.map((e) =>
    [
      e.nip,
      e.name,
      e.email,
      e.phone ?? "",
      e.position,
      e.department,
      e.joinDate.toISOString().slice(0, 10), // YYYY-MM-DD
      e.status,
    ]
      .map((v) => escapeCsv(String(v)))
      .join(","),
  );

  const csv = [header, ...lines].join("\r\n");

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(`﻿${csv}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="karyawan-${stamp}.csv"`,
    },
  });
}
