import Link from "next/link";
import {
  ArrowRight,
  Building2,
  FileDown,
  Plus,
  UserCheck,
  UserCog,
  UserX,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getEmployeeStats, getRecentEmployees } from "@/lib/actions/employee";
import { getUserCount } from "@/lib/actions/users";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const [employeeStats, userCount, recentEmployees] = await Promise.all([
    getEmployeeStats(),
    isAdmin ? getUserCount() : Promise.resolve(null),
    getRecentEmployees(),
  ]);
  const activePercentage = employeeStats.total
    ? Math.round((employeeStats.active / employeeStats.total) * 100)
    : 0;
  const inactivePercentage = 100 - activePercentage;
  const roleLabel = isAdmin ? "ADMIN" : "STAFF";
  const userName = session?.user?.name || "Pengguna";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan data karyawan"
      />

      <section className="rounded-xl border bg-card p-6 shadow">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Selamat datang kembali,</p>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">{userName}</h2>
              <Badge variant={isAdmin ? "default" : "secondary"}>{roleLabel}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Pantau informasi karyawan dan aktivitas penting dari satu tempat.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/employees/new">
                <Plus />
                Tambah Karyawan
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/employees">
                Lihat Karyawan
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Karyawan"
          value={employeeStats.total}
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
        />
        <SummaryCard
          label="Karyawan Aktif"
          value={employeeStats.active}
          icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
        />
        <SummaryCard
          label="Karyawan Tidak Aktif"
          value={employeeStats.inactive}
          icon={<UserX className="h-5 w-5 text-muted-foreground" />}
        />
        <SummaryCard
          label="Total Departemen"
          value={employeeStats.byDepartment.length}
          icon={<Building2 className="h-5 w-5 text-muted-foreground" />}
        />
        {isAdmin && userCount !== null ? (
          <SummaryCard
            label="Total User"
            value={userCount}
            icon={<UserCog className="h-5 w-5 text-muted-foreground" />}
          />
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle>Karyawan Terbaru</CardTitle>
              <p className="text-sm text-muted-foreground">Lima data terakhir yang ditambahkan</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/employees">Lihat semua</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentEmployees.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada data karyawan.</p>
            ) : (
              <div className="space-y-4">
                {recentEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                      {employee.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/employees/${employee.id}`} className="font-medium hover:underline">
                        {employee.name}
                      </Link>
                      <p className="truncate text-sm text-muted-foreground">
                        {employee.position} · {employee.department}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={employee.status === "ACTIVE" ? "success" : "muted"}>
                        {employee.status === "ACTIVE" ? "Aktif" : "Tidak Aktif"}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(employee.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Departemen</CardTitle>
            <p className="text-sm text-muted-foreground">Komposisi karyawan per departemen</p>
          </CardHeader>
          <CardContent>
            {employeeStats.byDepartment.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada data departemen.</p>
            ) : (
              <div className="space-y-4">
                {employeeStats.byDepartment.map((department) => {
                  const percentage = employeeStats.total
                    ? Math.round((department.count / employeeStats.total) * 100)
                    : 0;
                  return (
                    <div key={department.department} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{department.department}</span>
                        <span className="text-muted-foreground">{department.count} karyawan</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader>
            <CardTitle>Status Karyawan</CardTitle>
            <p className="text-sm text-muted-foreground">Perbandingan karyawan aktif dan tidak aktif</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Aktif</span>
                <span className="text-muted-foreground">{employeeStats.active} ({activePercentage}%)</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-emerald-600" style={{ width: `${activePercentage}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Tidak Aktif</span>
                <span className="text-muted-foreground">{employeeStats.inactive} ({inactivePercentage}%)</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-muted-foreground" style={{ width: `${inactivePercentage}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <p className="text-sm text-muted-foreground">Akses tugas yang sering digunakan</p>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild className="justify-start">
              <Link href="/employees/new"><Plus /> Tambah Karyawan</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/api/employees/export"><FileDown /> Export CSV</Link>
            </Button>
            {isAdmin ? (
              <Button asChild variant="outline" className="justify-start">
                <Link href="/users"><UserCog /> Manajemen User</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
