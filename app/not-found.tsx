import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-2xl font-semibold">Halaman tidak ditemukan</h2>
      <p className="text-sm text-muted-foreground">
        Halaman yang Anda cari tidak ada.
      </p>
      <Button asChild>
        <Link href="/employees">Ke daftar karyawan</Link>
      </Button>
    </div>
  );
}
