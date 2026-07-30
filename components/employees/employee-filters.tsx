"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DEPARTMENTS } from "@/lib/validations/employee";

export function EmployeeFilters({
  departments,
}: {
  departments: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  // Gabungkan daftar departemen dari data + daftar baku.
  const deptSet = new Set<string>([...DEPARTMENTS, ...departments]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = String(fd.get("q") ?? "").trim();
    const department = String(fd.get("department") ?? "");
    const status = String(fd.get("status") ?? "");

    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (department) sp.set("department", department);
    if (status) sp.set("status", status);
    // Pertahankan sort/order saat filter berubah.
    const curSort = params.get("sort");
    const curOrder = params.get("order");
    if (curSort) sp.set("sort", curSort);
    if (curOrder) sp.set("order", curOrder);
    sp.set("page", "1");

    startTransition(() => {
      router.push(`/employees?${sp.toString()}`);
    });
  }

  function clearFilters() {
    startTransition(() => {
      router.push("/employees");
    });
  }

  const selectClass =
    "flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 md:flex-row md:items-center"
    >
      <Input
        name="q"
        defaultValue={params.get("q") ?? ""}
        placeholder="Cari nama / NIP / email..."
        className="md:w-64"
      />
      <select
        name="department"
        defaultValue={params.get("department") ?? ""}
        className={selectClass}
      >
        <option value="">Semua departemen</option>
        {[...deptSet].map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select
        name="status"
        defaultValue={params.get("status") ?? ""}
        className={selectClass}
      >
        <option value="">Semua status</option>
        <option value="ACTIVE">Aktif</option>
        <option value="INACTIVE">Tidak Aktif</option>
      </select>
      <div className="flex gap-2">
        <Button type="submit" variant="default" size="sm" disabled={pending}>
          {pending ? "Memfilter..." : "Cari"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearFilters}
          disabled={pending}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
