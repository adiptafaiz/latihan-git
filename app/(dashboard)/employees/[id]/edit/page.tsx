import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeForm } from "@/components/employees/employee-form";
import { getEmployeeById } from "@/lib/actions/employee";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await getEmployeeById(id);

  if (!employee) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Karyawan">
        <Button asChild variant="outline" size="sm">
          <Link href={`/employees/${employee.id}`}>
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Edit Data: {employee.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeForm mode="edit" employee={employee} />
        </CardContent>
      </Card>
    </div>
  );
}
