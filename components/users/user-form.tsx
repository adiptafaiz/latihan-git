"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DEPARTMENTS } from "@/lib/validations/employee";
import { createUser, updateUser } from "@/lib/actions/users";

type UserFormData = {
  id?: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  position?: string | null;
  department?: string | null;
  address?: string | null;
  status?: string;
  role?: string;
};

export function UserForm({
  mode,
  user,
}: {
  mode: "create" | "edit";
  user?: UserFormData;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [position, setPosition] = useState(user?.position ?? "");
  const [department, setDepartment] = useState(user?.department ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [status, setStatus] = useState(user?.status ?? "ACTIVE");
  const [role, setRole] = useState(user?.role ?? "staff");
  const [password, setPassword] = useState("");

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      email,
      phone,
      position,
      department,
      address,
      status,
      role,
      password: password || undefined,
    };

    startTransition(async () => {
      const res =
        mode === "create"
          ? await createUser(payload)
          : await updateUser(user!.id!, payload);

      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "create" ? "User dibuat" : "User diperbarui");
      router.push("/users");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">
            Nama <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Nomor HP</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">Jabatan</Label>
          <Input
            id="position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Divisi</Label>
          <select
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className={selectClass}
            disabled={pending}
          >
            <option value="">Pilih divisi</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Alamat</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <Label>Role <span className="text-destructive">*</span></Label>
          <div className="flex h-9 items-center gap-4">
            {(["admin", "staff"] as const).map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={role === r}
                  onChange={() => setRole(r)}
                  disabled={pending}
                />
                {r === "admin" ? "Admin" : "Staff"}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <div className="flex h-9 items-center gap-4">
            {(["ACTIVE", "INACTIVE"] as const).map((s) => (
              <label key={s} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="status"
                  value={s}
                  checked={status === s}
                  onChange={() => setStatus(s)}
                  disabled={pending}
                />
                {s === "ACTIVE" ? "Aktif" : "Tidak Aktif"}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="password">
            Password{" "}
            {mode === "create" ? (
              <span className="text-destructive">*</span>
            ) : (
              <span className="text-muted-foreground">(kosongkan jika tidak diganti)</span>
            )}
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={mode === "create"}
            minLength={mode === "create" ? 8 : undefined}
            disabled={pending}
            placeholder={mode === "edit" ? "••••••••" : "Minimal 8 karakter"}
          />
        </div>
      </div>

      <Separator />

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild disabled={pending}>
          <Link href="/users">Batal</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
