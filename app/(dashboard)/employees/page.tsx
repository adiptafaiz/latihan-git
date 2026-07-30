import Link from "next/link";
import { Plus, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmployeeTable } from "@/components/employees/employee-table";
import { EmployeeFilters } from "@/components/employees/employee-filters";
import { EmployeePagination } from "@/components/employees/employee-pagination";
import { ImportEmployeesButton } from "@/components/employees/import-employees-button";
import { auth } from "@/lib/auth";
import {
  getEmployees,
  getDepartments,
  type SortField,
  type SortOrder,
} from "@/lib/actions/employee";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function first(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

const VALID_SORTS: SortField[] = ["nip", "name", "department", "joinDate"];

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [sp, session] = await Promise.all([searchParams, auth()]);
  const q = first(sp.q);
  const department = first(sp.department);
  const statusRaw = first(sp.status);
  const pageRaw = first(sp.page);
  const sortRaw = first(sp.sort);
  const orderRaw = first(sp.order);
  const page = pageRaw ? Math.max(1, Number(pageRaw) || 1) : 1;

  const status =
    statusRaw === "ACTIVE" || statusRaw === "INACTIVE" ? statusRaw : undefined;

  const sort: SortField = VALID_SORTS.includes(sortRaw as SortField)
    ? (sortRaw as SortField)
    : "name";
  const order: SortOrder = orderRaw === "asc" ? "asc" : "desc";

  const [{ data, total, totalPages, sort: resSort, order: resOrder }, departments] =
    await Promise.all([
      getEmployees({ q, department, status, page, pageSize: 10, sort, order }),
      getDepartments(),
    ]);

  const current = { field: resSort, order: resOrder };
  const tableSearchParams: Record<string, string | undefined> = {
    q,
    department,
    status,
    sort,
    order,
  };
  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Karyawan"
        description={`Total ${total} karyawan terdaftar`}
      >
        <div className="flex flex-wrap gap-2">
          {isAdmin ? <ImportEmployeesButton /> : null}
          <Button asChild variant="outline">
            <Link href="/api/employees/export">
              <Download className="h-4 w-4" />
              Export CSV
            </Link>
          </Button>
          <Button asChild>
            <Link href="/employees/new">
              <Plus className="h-4 w-4" />
              Tambah Karyawan
            </Link>
          </Button>
        </div>
      </PageHeader>

      <EmployeeFilters departments={departments} />

      <EmployeeTable
        data={data}
        current={current}
        searchParams={tableSearchParams}
      />

      <EmployeePagination
        page={page}
        totalPages={totalPages}
        searchParams={tableSearchParams}
      />
    </div>
  );
}
