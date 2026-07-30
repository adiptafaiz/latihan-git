"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const profileSelfSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(255).optional().or(z.literal("")),
  image: z.string().url("URL foto tidak valid").optional().or(z.literal("")),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password lama wajib"),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi wajib"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Password baru dan konfirmasi tidak sama",
    path: ["confirmPassword"],
  });

export type ProfileResult =
  | { success: true }
  | { success: false; error: string };

/** Update profil sendiri (staff): foto, nama, no hp, alamat. */
export async function updateOwnProfile(raw: unknown): Promise<ProfileResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Belum login" };

  const parsed = profileSelfSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)
      .flat()
      .filter(Boolean)[0];
    return { success: false, error: first ?? "Data tidak valid" };
  }

  const { image, phone, address, name } = parsed.data;
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      phone: phone || null,
      address: address || null,
      image: image || null,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

/** Ganti password sendiri (staff + admin). */
export async function changeOwnPassword(raw: unknown): Promise<ProfileResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Belum login" };

  const parsed = passwordSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)
      .flat()
      .filter(Boolean)[0];
    return { success: false, error: first ?? "Data tidak valid" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  if (!user?.password) return { success: false, error: "User tidak ditemukan" };

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!ok) return { success: false, error: "Password lama salah" };

  const hash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hash },
  });

  return { success: true };
}
