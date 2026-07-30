import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserForm } from "@/components/users/user-form";
import { auth } from "@/lib/auth";

export default async function NewUserPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/profile");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Tambah User">
        <Button asChild variant="outline" size="sm">
          <Link href="/users">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>User Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
