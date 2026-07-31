import { describe, it, expect } from "vitest";
import {
  employeeSchema,
  employeeStatusEnum,
  DEPARTMENTS,
} from "@/lib/validations/employee";

const validEmployee = {
  nip: "EMP001",
  name: "Budi Santoso",
  email: "budi@perusahaan.com",
  phone: "081234567890",
  position: "Software Engineer",
  department: "Engineering",
  joinDate: "2023-01-15",
  status: "ACTIVE" as const,
};

describe("employeeStatusEnum", () => {
  it("menerima ACTIVE", () => {
    expect(employeeStatusEnum.parse("ACTIVE")).toBe("ACTIVE");
  });

  it("menerima INACTIVE", () => {
    expect(employeeStatusEnum.parse("INACTIVE")).toBe("INACTIVE");
  });

  it("menolak nilai lain", () => {
    expect(() => employeeStatusEnum.parse("PENDING")).toThrow();
    expect(() => employeeStatusEnum.parse("")).toThrow();
  });
});

describe("employeeSchema - valid case", () => {
  it("lolos untuk data karyawan valid", () => {
    const result = employeeSchema.safeParse(validEmployee);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nip).toBe("EMP001");
      expect(result.data.joinDate).toBeInstanceOf(Date);
    }
  });

  it("menerima phone kosong (string kosong)", () => {
    const result = employeeSchema.safeParse({ ...validEmployee, phone: "" });
    expect(result.success).toBe(true);
  });

  it("menerima phone tidak ada (undefined)", () => {
    const { phone: _phone, ...rest } = validEmployee;
    const result = employeeSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("default status = ACTIVE", () => {
    const { status, ...rest } = validEmployee;
    const result = employeeSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("ACTIVE");
    }
  });
});

describe("employeeSchema - NIP", () => {
  it("gagal jika NIP kosong", () => {
    const result = employeeSchema.safeParse({ ...validEmployee, nip: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.nip).toBeDefined();
    }
  });

  it("gagal jika NIP > 30 karakter", () => {
    const result = employeeSchema.safeParse({
      ...validEmployee,
      nip: "A".repeat(31),
    });
    expect(result.success).toBe(false);
  });

  it("gagal jika NIP mengandung karakter ilegal", () => {
    const result = employeeSchema.safeParse({
      ...validEmployee,
      nip: "EMP 001@",
    });
    expect(result.success).toBe(false);
  });

  it("menerima NIP dengan strip", () => {
    const result = employeeSchema.safeParse({
      ...validEmployee,
      nip: "EMP-001-A",
    });
    expect(result.success).toBe(true);
  });
});

describe("employeeSchema - nama", () => {
  it("gagal jika nama < 2 karakter", () => {
    const result = employeeSchema.safeParse({ ...validEmployee, name: "A" });
    expect(result.success).toBe(false);
  });

  it("gagal jika nama kosong", () => {
    const result = employeeSchema.safeParse({ ...validEmployee, name: "" });
    expect(result.success).toBe(false);
  });

  it("gagal jika nama > 100 karakter", () => {
    const result = employeeSchema.safeParse({
      ...validEmployee,
      name: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

describe("employeeSchema - email", () => {
  it("gagal jika email format tidak valid", () => {
    const result = employeeSchema.safeParse({
      ...validEmployee,
      email: "bukan-email",
    });
    expect(result.success).toBe(false);
  });

  it("gagal jika email kosong", () => {
    const result = employeeSchema.safeParse({ ...validEmployee, email: "" });
    expect(result.success).toBe(false);
  });
});

describe("employeeSchema - departemen & jabatan", () => {
  it("gagal jika departemen kosong", () => {
    const result = employeeSchema.safeParse({
      ...validEmployee,
      department: "",
    });
    expect(result.success).toBe(false);
  });

  it("gagal jika jabatan kosong", () => {
    const result = employeeSchema.safeParse({
      ...validEmployee,
      position: "",
    });
    expect(result.success).toBe(false);
  });

  it("semua DEPARTMENTS dikenali schema", () => {
    for (const d of DEPARTMENTS) {
      const result = employeeSchema.safeParse({
        ...validEmployee,
        department: d,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("employeeSchema - joinDate", () => {
  it("coerce string ISO menjadi Date", () => {
    const result = employeeSchema.safeParse({
      ...validEmployee,
      joinDate: "2020-05-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.joinDate).toBeInstanceOf(Date);
    }
  });

  it("coerce tanggal tidak valid menjadi error", () => {
    const result = employeeSchema.safeParse({
      ...validEmployee,
      joinDate: "tanggal-salah",
    });
    expect(result.success).toBe(false);
  });

  it("gagal jika joinDate kosong", () => {
    const result = employeeSchema.safeParse({
      ...validEmployee,
      joinDate: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("employeeSchema - phone", () => {
  it("gagal jika phone > 20 karakter", () => {
    const result = employeeSchema.safeParse({
      ...validEmployee,
      phone: "0".repeat(21),
    });
    expect(result.success).toBe(false);
  });
});
