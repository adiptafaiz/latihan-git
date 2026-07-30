"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { employeeStatusEnum } from "@/lib/validations/employee";

const userAdminSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional().or(z.literal("")),
  position: z.string().max(80).optional().or(z.literal("")),
  department: z.string().max(80).optional().or(z.literal("")),
  address: z.string().max(255).optional().or(z.literal("")),
  status: employeeStatusEnum,
  role: z.enum(["admin", "staff"]),
  password: z.string().min(8, "Password minimal 8 karakter").optional().or(z.literal("")),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("Hanya admin yang dapat mengakses ini");
  }
  return session;
}

export type UserResult =
  | { success: true }
  | { success: false; error: string };

export async function getUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      position: true,
      department: true,
      status: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function getUserCount() {
  await requireAdmin();
  return prisma.user.count();
}

export async function getUserById(id: string) {
  await requireAdmin();
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      position: true,
      department: true,
      address: true,
      status: true,
      role: true,
    },
  });
}

export async function createUser(raw: unknown): Promise<UserResult> {
  await requireAdmin();

  const parsed = userAdminSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)
      .flat().filter(Boolean)[0];
    return { success: false, error: first ?? "Data tidak valid" };
  }

  if (!parsed.data.password) {
    return { success: false, error: "Password wajib diisi" };
  }

  const hash = await bcrypt.hash(parsed.data.password, 12);
  const fields = { ...parsed.data };
  delete fields.password;

  try {
    await prisma.user.create({
      data: { ...fields, password: hash },
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { success: false, error: "Email sudah terdaftar" };
    }
    throw e;
  }

  revalidatePath("/users");
  return { success: true };
}

export async function updateUser(id: string, raw: unknown): Promise<UserResult> {
  await requireAdmin();

  const parsed = userAdminSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)
      .flat().filter(Boolean)[0];
    return { success: false, error: first ?? "Data tidak valid" };
  }

  const { password } = parsed.data;
  const fields = { ...parsed.data };
  delete fields.password;
  const data: Record<string, unknown> = { ...fields };
  if (password) {
    data.password = await bcrypt.hash(password, 12);
  }

  try {
    await prisma.user.update({ where: { id }, data });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { success: false, error: "Email sudah terdaftar" };
    }
    if (e instanceof Error && e.message.includes("Record to update not found")) {
      return { success: false, error: "User tidak ditemukan" };
    }
    throw e;
  }

  revalidatePath("/users");
  return { success: true };
}

export async function deleteUser(id: string): Promise<UserResult> {
  const session = await requireAdmin();
  if (id === session.user.id) {
    return { success: false, error: "Tidak bisa menghapus diri sendiri" };
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Record to delete not found")) {
      return { success: false, error: "User tidak ditemukan" };
    }
    throw e;
  }

  revalidatePath("/users");
  return { success: true };
}
