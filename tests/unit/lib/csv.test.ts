import { describe, it, expect } from "vitest";
import { parseCsv, escapeCsv, CSV_HEADERS } from "@/lib/csv";

describe("escapeCsv", () => {
  it("mengembalikan string biasa tanpa escape", () => {
    expect(escapeCsv("hello")).toBe("hello");
  });

  it("escape koma dengan quote", () => {
    expect(escapeCsv("hello, world")).toBe('"hello, world"');
  });

  it("escape newline dengan quote", () => {
    expect(escapeCsv("line1\nline2")).toBe('"line1\nline2"');
  });

  it("escape carriage return dengan quote", () => {
    expect(escapeCsv("a\rb")).toBe('"a\rb"');
  });

  it("escape tanda quote dengan double-quote", () => {
    expect(escapeCsv('say "hi"')).toBe('"say ""hi"""');
  });

  it("escape kombinasi koma + quote", () => {
    expect(escapeCsv('a,b"c')).toBe('"a,b""c"');
  });
});

describe("parseCsv - basic", () => {
  it("parse baris tunggal dengan koma", () => {
    expect(parseCsv("a,b,c")).toEqual([["a", "b", "c"]]);
  });

  it("parse multi-baris dengan newline", () => {
    expect(parseCsv("a,b\nc,d")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("parse dengan CRLF", () => {
    expect(parseCsv("a,b\r\nc,d")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("parse dengan trailing newline", () => {
    expect(parseCsv("a,b\nc,d\n")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("parse file kosong return array kosong", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

describe("parseCsv - quoted fields", () => {
  it("mempertahankan koma di dalam quote", () => {
    expect(parseCsv('"a,b",c')).toEqual([["a,b", "c"]]);
  });

  it("mempertahankan newline di dalam quote", () => {
    expect(parseCsv('"a\nb",c')).toEqual([["a\nb", "c"]]);
  });

  it("escape double-quote di dalam field quoted", () => {
    expect(parseCsv('"say ""hi""",x')).toEqual([['say "hi"', "x"]]);
  });

  it("quote kosong adalah field kosong", () => {
    expect(parseCsv('"",b')).toEqual([["", "b"]]);
  });
});

describe("parseCsv - real-world", () => {
  it("parse header + sample karyawan", () => {
    const csv = [
      CSV_HEADERS.join(","),
      'EMP001,Budi,budi@x.com,08123,SE,Engineering,2023-01-15,ACTIVE',
    ].join("\n");

    const rows = parseCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual([...CSV_HEADERS]);
    expect(rows[1][0]).toBe("EMP001");
    expect(rows[1][2]).toBe("budi@x.com");
    expect(rows[1][7]).toBe("ACTIVE");
  });

  it("trim baris benar-benar kosong", () => {
    const csv = "a,b\n\n\nc,d\n";
    expect(parseCsv(csv)).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("round-trip: escape → parse (untuk field tanpa karakter spesial)", () => {
    const fields = ["EMP001", "Budi", "budi@x.com"];
    const csv = fields.map((f) => escapeCsv(f)).join(",");
    expect(parseCsv(csv)).toEqual([fields]);
  });
});

describe("CSV_HEADERS", () => {
  it("memiliki 8 kolom sesuai kontrak", () => {
    expect(CSV_HEADERS).toHaveLength(8);
    expect(CSV_HEADERS).toContain("nip");
    expect(CSV_HEADERS).toContain("name");
    expect(CSV_HEADERS).toContain("email");
    expect(CSV_HEADERS).toContain("phone");
    expect(CSV_HEADERS).toContain("position");
    expect(CSV_HEADERS).toContain("department");
    expect(CSV_HEADERS).toContain("joinDate");
    expect(CSV_HEADERS).toContain("status");
  });
});
