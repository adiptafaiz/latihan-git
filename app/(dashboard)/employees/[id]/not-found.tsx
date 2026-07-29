import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <h2 className="text-2xl font-semibold">Karyawan tidak ditemukan</h2>
      <p className="text-sm text-muted-foreground">
        Data karyawan mungkin sudah dihapus atau ID tidak valid.
      </p>
      <Button asChild>
        <Link href="/employees">Kembali ke daftar</Link>
      </Button>
    </div>
  );
}
