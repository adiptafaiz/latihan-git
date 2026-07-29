"use client";

import { useActionState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DEPARTMENTS } from "@/lib/validations/employee";
import {
  createEmployeeAction,
  updateEmployeeAction,
  type ActionResult,
} from "@/lib/actions/employee";
import { toDateInputValue } from "@/lib/utils";

type EmployeeFormProps = {
  mode: "create" | "edit";
  employee?: {
    id: string;
    nip: string;
    name: string;
    email: string;
    phone: string | null;
    position: string;
    department: string;
    joinDate: Date;
    status: "ACTIVE" | "INACTIVE";
  };
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return (
    <p className="mt-1 text-xs text-destructive">{messages[0]}</p>
  );
}

export function EmployeeForm({ mode, employee }: EmployeeFormProps) {
  const action = mode === "create" ? createEmployeeAction : updateEmployeeAction;
  const [state, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    action,
    undefined,
  );

  // Tampilkan error non-field (string) sebagai toast.
  const formError =
    state && state.success === false && typeof state.error === "string"
      ? state.error
      : undefined;
  const fieldErrors =
    state && state.success === false && typeof state.error === "object"
      ? state.error
      : undefined;

  if (formError) {
    toast.error(formError);
  }

  return (
    <form action={formAction} className="space-y-4">
      {mode === "edit" && employee ? (
        <input type="hidden" name="id" value={employee.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* NIP */}
        <div className="space-y-2">
          <Label htmlFor="nip">
            NIP <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nip"
            name="nip"
            defaultValue={employee?.nip}
            placeholder="cth: EMP001"
            required
          />
          <FieldError messages={fieldErrors?.nip} />
        </div>

        {/* Nama */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Nama Lengkap <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={employee?.name}
            placeholder="cth: Budi Santoso"
            required
          />
          <FieldError messages={fieldErrors?.name} />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={employee?.email}
            placeholder="cth: budi@perusahaan.com"
            required
          />
          <FieldError messages={fieldErrors?.email} />
        </div>

        {/* Telepon */}
        <div className="space-y-2">
          <Label htmlFor="phone">Telepon</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={employee?.phone ?? ""}
            placeholder="cth: 0812xxxx"
          />
          <FieldError messages={fieldErrors?.phone} />
        </div>

        {/* Jabatan */}
        <div className="space-y-2">
          <Label htmlFor="position">
            Jabatan <span className="text-destructive">*</span>
          </Label>
          <Input
            id="position"
            name="position"
            defaultValue={employee?.position}
            placeholder="cth: Software Engineer"
            required
          />
          <FieldError messages={fieldErrors?.position} />
        </div>

        {/* Departemen */}
        <div className="space-y-2">
          <Label htmlFor="department">
            Departemen <span className="text-destructive">*</span>
          </Label>
          <select
            id="department"
            name="department"
            defaultValue={employee?.department ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          >
            <option value="" disabled>
              Pilih departemen
            </option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <FieldError messages={fieldErrors?.department} />
        </div>

        {/* Tanggal bergabung */}
        <div className="space-y-2">
          <Label htmlFor="joinDate">
            Tanggal Bergabung <span className="text-destructive">*</span>
          </Label>
          <Input
            id="joinDate"
            name="joinDate"
            type="date"
            defaultValue={
              employee ? toDateInputValue(employee.joinDate) : undefined
            }
            required
          />
          <FieldError messages={fieldErrors?.joinDate} />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <div className="flex h-9 items-center gap-4">
            {(["ACTIVE", "INACTIVE"] as const).map((s) => (
              <label
                key={s}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="status"
                  value={s}
                  defaultChecked={employee ? employee.status === s : s === "ACTIVE"}
                  className="h-4 w-4"
                />
                {s === "ACTIVE" ? "Aktif" : "Tidak Aktif"}
              </label>
            ))}
          </div>
          <FieldError messages={fieldErrors?.status} />
        </div>
      </div>

      <Separator />

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href="/employees">Batal</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
