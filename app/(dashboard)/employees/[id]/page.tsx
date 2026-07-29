import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import { DeleteEmployeeButton } from "@/components/employees/delete-employee-button";
import { getEmployeeById } from "@/lib/actions/employee";
import { formatDate } from "@/lib/utils";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await getEmployeeById(id);

  if (!employee) notFound();

  const rows: { label: string; value: string | React.ReactNode }[] = [
    { label: "NIP", value: employee.nip },
    { label: "Nama Lengkap", value: employee.name },
    { label: "Email", value: employee.email },
    { label: "Telepon", value: employee.phone || "—" },
    { label: "Jabatan", value: employee.position },
    { label: "Departemen", value: employee.department },
    { label: "Tanggal Bergabung", value: formatDate(employee.joinDate) },
    {
      label: "Status",
      value: <EmployeeStatusBadge status={employee.status} />,
    },
    { label: "Dibuat", value: formatDate(employee.createdAt) },
    { label: "Diperbarui", value: formatDate(employee.updatedAt) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={employee.name}>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/employees">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/employees/${employee.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>
          <DeleteEmployeeButton
            id={employee.id}
            name={employee.name}
            redirectTo="/employees"
          />
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Detail Karyawan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {rows.map((r, i) => (
              <div key={i}>
                <p className="text-sm text-muted-foreground">{r.label}</p>
                <div className="font-medium">{r.value}</div>
                {i < rows.length - 1 ? <Separator className="mt-3 sm:hidden" /> : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
