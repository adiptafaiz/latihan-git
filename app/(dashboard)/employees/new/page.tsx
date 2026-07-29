import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeForm } from "@/components/employees/employee-form";

export default function NewEmployeePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tambah Karyawan">
        <Button asChild variant="outline" size="sm">
          <Link href="/employees">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Data Karyawan Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
