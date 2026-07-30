import Link from "next/link";
import { Users, LayoutDashboard, UserCircle } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-4">
          <span className="flex items-center gap-2 font-semibold">
            <Users className="h-5 w-5" />
            <span className="hidden sm:inline">Pendataan Karyawan</span>
          </span>
          <nav className="ml-4 flex items-center gap-1 text-sm">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/employees"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Users className="h-4 w-4" />
              Karyawan
            </Link>
            {isAdmin && (
              <Link
                href="/users"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Users className="h-4 w-4" />
                Manajemen User
              </Link>
            )}
            <Link
              href="/profile"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <UserCircle className="h-4 w-4" />
              Profil
            </Link>
          </nav>
          <div className="ml-auto">
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
