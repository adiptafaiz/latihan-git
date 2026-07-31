/** Utilitas CSV sederhana tanpa dependency eksternal. */

/** Escape satu nilai field sesuai RFC 4180. */
export function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Parser CSV minimal: mendukung field quoted, koma di dalam quote,
 * dan escape `""`. Mengembalikan array 2D baris-kolom.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }

  // Field/baris terakhir (file tanpa newline akhir).
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Buang baris benar-benar kosong.
  return rows.filter((r) => r.length > 0 && !(r.length === 1 && r[0] === ""));
}

/** Header CSV standar untuk data karyawan. */
export const CSV_HEADERS = [
  "nip",
  "name",
  "email",
  "phone",
  "position",
  "department",
  "joinDate",
  "status",
] as const;
