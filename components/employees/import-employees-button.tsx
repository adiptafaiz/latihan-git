"use client";

import { useState, useTransition, useRef } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { importEmployees, type ImportResult } from "@/lib/actions/import-employees";

type ImportError = { row: number; message: string };

export function ImportEmployeesButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setResult(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("File harus berekstensi .csv");
      return;
    }
    const text = await file.text();
    startTransition(async () => {
      const res = await importEmployees(text);
      setResult(res);
      if (res.success) {
        toast.success(
          `Import selesai: ${res.imported} berhasil, ${res.skippedDuplicateNip} NIP duplikat dilewati`,
        );
      } else {
        toast.error("Import gagal");
      }
    });
  }

  function downloadTemplate() {
    const header = "nip,name,email,phone,position,department,joinDate,status";
    const emptyRows = Array.from({ length: 5 }, () => ",,,,,,,").join("\r\n");
    downloadCsv(`${header}\r\n${emptyRows}\r\n`, "template-karyawan.csv");
  }

  function downloadExampleCsv() {
    const header = "nip,name,email,phone,position,department,joinDate,status";
    const examples = [
      "EMP999,Contoh Karyawan Satu,contoh999@example.invalid,081299900001,Contoh Jabatan,Engineering,2025-01-15,ACTIVE",
      "EMP998,Contoh Karyawan Dua,contoh998@example.invalid,081299900002,Contoh Jabatan,Human Resources,2025-02-15,ACTIVE",
      "EMP997,Contoh Karyawan Tiga,contoh997@example.invalid,081299900003,Contoh Jabatan,Finance,2025-03-15,INACTIVE",
    ].join("\r\n");
    downloadCsv(`${header}\r\n${examples}\r\n`, "contoh-karyawan.csv");
  }

  function downloadCsv(content: string, filename: string) {
    const blob = new Blob([content], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" />
        Import CSV
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Import Data Karyawan (CSV)</CardTitle>
              <CardDescription>
                Unggah file CSV dengan kolom: nip, name, email, phone, position,
                department, joinDate (YYYY-MM-DD), status (ACTIVE/INACTIVE).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={downloadTemplate}
                >
                  Unduh template
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={downloadExampleCsv}
                >
                  Download Example CSV
                </Button>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                disabled={pending}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
                className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-primary-foreground"
              />

              {result ? (
                <div className="space-y-2 rounded-md border p-3 text-sm">
                  <p>
                    📄 <strong>{result.totalProcessed}</strong> total baris diproses
                  </p>
                  <p>
                    ✅ <strong>{result.imported}</strong> berhasil diimpor
                  </p>
                  <p>
                    ⏭️ <strong>{result.skippedDuplicateNip}</strong> dilewati (NIP duplikat)
                  </p>
                  <p>
                    ⚠️ <strong>{result.failed}</strong> gagal
                  </p>
                  {result.errors.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto">
                      <p className="mb-1 font-medium text-destructive">
                        Baris gagal:
                      </p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {result.errors.map((e: ImportError, i: number) => (
                          <li key={i}>
                            Baris {e.row}: {e.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    setResult(null);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                >
                  Tutup
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
