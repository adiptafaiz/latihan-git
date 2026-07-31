import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DeleteUserButton } from "@/components/users/delete-user-button";
import { auth } from "@/lib/auth";
import { getUsers } from "@/lib/actions/users";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/profile");
  }

  const users = await getUsers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen User"
        description={`Total ${users.length} user terdaftar`}
      >
        <Button asChild>
          <Link href="/users/new">
            <ArrowRight className="h-4 w-4" />
            Tambah User
          </Link>
        </Button>
      </PageHeader>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Divisi</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Belum ada user.
                </TableCell>
              </TableRow>
            ) : users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.department ?? "—"}</TableCell>
                <TableCell>{user.position ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role === "admin" ? "Admin" : "Staff"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === "ACTIVE" ? "success" : "muted"}>
                    {user.status === "ACTIVE" ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/users/${user.id}/edit`}>Edit</Link>
                    </Button>
                    <DeleteUserButton id={user.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
