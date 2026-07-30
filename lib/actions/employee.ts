"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  employeeSchema,
  type EmployeeFieldErrors,
} from "@/lib/validations/employee";

export type EmployeeStatus = "ACTIVE" | "INACTIVE";

export type ActionResult =
  | { success: true }
  | { success: false; error: EmployeeFieldErrors | string };

function normalizeEmployeeStatus(status: string): EmployeeStatus {
  return status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
}

async function getCurrentRole(): Promise<"admin" | "staff" | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user.role === "admin" ? "admin" : "staff";
}

/** Mapping error unique Prisma P2002 → pesan per field */
function mapUniqueError(
  target: string[] | undefined,
): EmployeeFieldErrors | string {
  if (!target) return "Data duplikat";
  if (target.includes("nip")) return { nip: ["NIP sudah terdaftar"] };
  if (target.includes("email")) return { email: ["Email sudah terdaftar"] };
  return "Data duplikat";
}

export async function createEmployee(raw: unknown): Promise<ActionResult> {
  if (!(await getCurrentRole())) {
    return { success: false, error: "Silakan login terlebih dahulu" };
  }

  const parsed = employeeSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten().fieldErrors as EmployeeFieldErrors,
    };
  }

  const { phone, ...rest } = parsed.data;
  const data = { ...rest, phone: phone || null };

  try {
    await prisma.employee.create({ data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        success: false,
        error: mapUniqueError(e.meta?.target as string[] | undefined),
      };
    }
    throw e;
  }

  revalidatePath("/employees");
  redirect("/employees");
}

/** Wrapper untuk useActionState (form create) */
export async function createEmployeeAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return createEmployee(Object.fromEntries(formData.entries()));
}

export async function updateEmployee(
  id: string,
  raw: unknown,
): Promise<ActionResult> {
  if (!(await getCurrentRole())) {
    return { success: false, error: "Silakan login terlebih dahulu" };
  }

  const parsed = employeeSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten().fieldErrors as EmployeeFieldErrors,
    };
  }

  const { phone, ...rest } = parsed.data;
  const data = { ...rest, phone: phone || null };

  try {
    await prisma.employee.update({ where: { id }, data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return { success: false, error: "Karyawan tidak ditemukan" };
      if (e.code === "P2002") {
        return {
          success: false,
          error: mapUniqueError(e.meta?.target as string[] | undefined),
        };
      }
    }
    throw e;
  }

  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  redirect(`/employees/${id}`);
}

/** Wrapper untuk useActionState (form edit). id lewat hidden input. */
export async function updateEmployeeAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const entries = Object.fromEntries(formData.entries());
  delete entries.id;
  return updateEmployee(id, entries);
}

export async function deleteEmployee(id: string): Promise<ActionResult> {
  if ((await getCurrentRole()) !== "admin") {
    return { success: false, error: "Hanya admin yang dapat menghapus karyawan" };
  }

  try {
    await prisma.employee.delete({ where: { id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return { success: false, error: "Karyawan tidak ditemukan" };
    }
    throw e;
  }

  revalidatePath("/employees");
  redirect("/employees");
}

export type SortField = "nip" | "name" | "department" | "joinDate";
export type SortOrder = "asc" | "desc";

export type GetEmployeesParams = {
  q?: string;
  department?: string;
  status?: EmployeeStatus;
  page?: number;
  pageSize?: number;
  sort?: SortField;
  order?: SortOrder;
};

/** Field yang boleh di-sort (mencegah injection field acak). */
const SORTABLE_FIELDS: Record<SortField, true> = {
  nip: true,
  name: true,
  department: true,
  joinDate: true,
};

export async function getEmployees(params: GetEmployeesParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 10));
  const q = params.q?.trim();

  const sortField: SortField = SORTABLE_FIELDS[params.sort ?? "name"]
    ? (params.sort ?? "name")
    : "name";
  const order: SortOrder = params.order === "asc" ? "asc" : "desc";

  const where: Prisma.EmployeeWhereInput = {
    AND: [
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { nip: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
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
      orderBy: { [sortField]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.employee.count({ where }),
  ]);

  return {
    data: data.map((employee) => ({
      ...employee,
      status: normalizeEmployeeStatus(employee.status),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    sort: sortField,
    order,
  };
}

export async function getEmployeeById(id: string) {
  const employee = await prisma.employee.findUnique({ where: { id } });
  return employee
    ? { ...employee, status: normalizeEmployeeStatus(employee.status) }
    : null;
}

/** Lima karyawan terakhir untuk ringkasan dashboard. */
export async function getRecentEmployees() {
  const employees = await prisma.employee.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      position: true,
      department: true,
      status: true,
      createdAt: true,
    },
  });

  return employees.map((employee) => ({
    ...employee,
    status: normalizeEmployeeStatus(employee.status),
  }));
}

/** Ambil daftar departemen unik untuk dropdown filter */
export async function getDepartments() {
  const rows = await prisma.employee.findMany({
    distinct: ["department"],
    select: { department: true },
    orderBy: { department: "asc" },
  });
  return rows.map((r) => r.department);
}

export type EmployeeStats = {
  total: number;
  active: number;
  inactive: number;
  byDepartment: { department: string; count: number }[];
};

/** Ringkasan statistik untuk dashboard. */
export async function getEmployeeStats(): Promise<EmployeeStats> {
  const [total, active, inactive, grouped] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.employee.count({ where: { status: "INACTIVE" } }),
    prisma.employee.groupBy({
      by: ["department"],
      _count: { _all: true },
      orderBy: { department: "asc" },
    }),
  ]);

  return {
    total,
    active,
    inactive,
    byDepartment: grouped.map((g) => ({
      department: g.department,
      count: g._count._all,
    })),
  };
}
