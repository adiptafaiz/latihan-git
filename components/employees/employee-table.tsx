import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import { formatDate } from "@/lib/utils";

type EmployeeRow = {
  id: string;
  nip: string;
  name: string;
  email: string;
  department: string;
  position: string;
  joinDate: Date;
  status: "ACTIVE" | "INACTIVE";
};

export function EmployeeTable({ data }: { data: EmployeeRow[] }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Belum ada data karyawan.
        </p>
        <Button asChild size="sm">
          <Link href="/employees/new">Tambah karyawan</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">NIP</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Departemen</TableHead>
            <TableHead className="hidden md:table-cell">Jabatan</TableHead>
            <TableHead className="hidden lg:table-cell">Bergabung</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((emp) => (
            <TableRow key={emp.id}>
              <TableCell className="font-mono text-xs">{emp.nip}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{emp.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {emp.email}
                  </span>
                </div>
              </TableCell>
              <TableCell>{emp.department}</TableCell>
              <TableCell className="hidden md:table-cell">
                {emp.position}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground">
                {formatDate(emp.joinDate)}
              </TableCell>
              <TableCell>
                <EmployeeStatusBadge status={emp.status} />
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/employees/${emp.id}`}>Detail</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
