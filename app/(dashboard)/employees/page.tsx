import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmployeeTable } from "@/components/employees/employee-table";
import { EmployeeFilters } from "@/components/employees/employee-filters";
import { EmployeePagination } from "@/components/employees/employee-pagination";
import { getEmployees, getDepartments } from "@/lib/actions/employee";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function first(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = first(sp.q);
  const department = first(sp.department);
  const statusRaw = first(sp.status);
  const pageRaw = first(sp.page);
  const page = pageRaw ? Math.max(1, Number(pageRaw) || 1) : 1;

  const status =
    statusRaw === "ACTIVE" || statusRaw === "INACTIVE" ? statusRaw : undefined;

  const [{ data, total, totalPages }, departments] = await Promise.all([
    getEmployees({ q, department, status, page, pageSize: 10 }),
    getDepartments(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Karyawan"
        description={`Total ${total} karyawan terdaftar`}
      >
        <Button asChild>
          <Link href="/employees/new">
            <Plus className="h-4 w-4" />
            Tambah Karyawan
          </Link>
        </Button>
      </PageHeader>

      <EmployeeFilters departments={departments} />

      <EmployeeTable data={data} />

      <EmployeePagination
        page={page}
        totalPages={totalPages}
        searchParams={{ q, department, status }}
      />
    </div>
  );
}
