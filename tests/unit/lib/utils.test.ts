import { describe, it, expect } from "vitest";
import { cn, formatDate, toDateInputValue } from "@/lib/utils";

describe("cn", () => {
  it("menggabungkan beberapa class", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("mendrop falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("mendukung conditional class", () => {
    expect(cn("base", true && "active", false && "hidden")).toBe("base active");
  });

  it("return string kosong jika semua input kosong", () => {
    expect(cn(false, null, undefined)).toBe("");
  });
});

describe("formatDate", () => {
  it("memformat Date object ke format Indonesia", () => {
    const date = new Date("2023-01-15T00:00:00Z");
    const result = formatDate(date);
    // Bisa bervariasi berdasarkan timezone, validasi pola: "DD bulan YYYY"
    expect(result).toMatch(/\d+ \w+ \d{4}/);
    expect(result).toContain("2023");
  });

  it("memformat ISO string", () => {
    const result = formatDate("2023-06-01T00:00:00Z");
    expect(result).toMatch(/\d+ \w+ \d{4}/);
    expect(result).toContain("2023");
  });
});

describe("toDateInputValue", () => {
  it("mengonversi Date ke YYYY-MM-DD", () => {
    const date = new Date("2023-01-15T12:00:00Z");
    const result = toDateInputValue(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.startsWith("2023-")).toBe(true);
  });

  it("menerima ISO string", () => {
    const result = toDateInputValue("2024-05-20T00:00:00Z");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.startsWith("2024-")).toBe(true);
  });
});
