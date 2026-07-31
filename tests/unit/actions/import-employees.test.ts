import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma client & auth sebelum import module yang memakainya
vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      employee: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock next/cache karena dipakai di server action
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { importEmployees } from "@/lib/actions/import-employees";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

const ADMIN_SESSION = {
  user: { id: "admin-1", role: "admin", email: "admin@x" },
  expires: new Date(Date.now() + 3600 * 1000).toISOString(),
};
const STAFF_SESSION = {
  user: { id: "staff-1", role: "staff", email: "staff@x" },
  expires: new Date(Date.now() + 3600 * 1000).toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("importEmployees - authorization", () => {
  it("tolak jika tidak ada session (belum login)", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await importEmployees("nip,name\n");
    expect(result.success).toBe(false);
    expect(result.errors[0].message).toMatch(/admin/);
  });

  it("tolak jika role bukan admin", async () => {
    mockAuth.mockResolvedValue(STAFF_SESSION as never);
    const result = await importEmployees("nip,name\n");
    expect(result.success).toBe(false);
    expect(result.errors[0].message).toMatch(/admin/);
  });

  it("izinkan admin", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION as never);
    mockPrisma.employee.findUnique.mockResolvedValue(null);
    mockPrisma.employee.create.mockResolvedValue({ id: "new" });

    const csv =
      "nip,name,email,phone,position,department,joinDate,status\r\n" +
      "EMP100,Budi,budi@x.com,08123,SE,Engineering,2023-01-15,ACTIVE";

    const result = await importEmployees(csv);
    expect(result.success).toBe(true);
    expect(result.imported).toBe(1);
  });
});

describe("importEmployees - parsing & validasi", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue(ADMIN_SESSION as never);
  });

  it("tolak CSV kosong", async () => {
    const result = await importEmployees("");
    expect(result.success).toBe(false);
    expect(result.errors[0].message).toMatch(/kosong/i);
  });

  it("skip baris header", async () => {
    mockPrisma.employee.findUnique.mockResolvedValue(null);
    mockPrisma.employee.create.mockResolvedValue({ id: "new" });

    const csv =
      "nip,name,email,phone,position,department,joinDate,status\r\n" +
      "EMP100,Budi,budi@x.com,08123,SE,Engineering,2023-01-15,ACTIVE";

    const result = await importEmployees(csv);
    expect(result.success).toBe(true);
    expect(result.totalProcessed).toBe(1);
  });

  it("skip NIP duplikat (sudah ada di DB)", async () => {
    mockPrisma.employee.findUnique.mockResolvedValue({ id: "existing" });

    const csv =
      "nip,name,email,phone,position,department,joinDate,status\r\n" +
      "EMP100,Budi,budi@x.com,08123,SE,Engineering,2023-01-15,ACTIVE";

    const result = await importEmployees(csv);
    expect(result.success).toBe(true);
    expect(result.skippedDuplicateNip).toBe(1);
    expect(result.imported).toBe(0);
  });

  it("catat error validasi per baris", async () => {
    mockPrisma.employee.findUnique.mockResolvedValue(null);

    const csv =
      "nip,name,email,phone,position,department,joinDate,status\r\n" +
      "EMP100,Budi,email-tidak-valid,08123,SE,Engineering,2023-01-15,ACTIVE";

    const result = await importEmployees(csv);
    expect(result.success).toBe(true);
    expect(result.failed).toBe(1);
    expect(result.errors[0].message).toMatch(/email/i);
  });

  it("catat error jika kolom tidak lengkap", async () => {
    const csv =
      "nip,name,email,phone,position,department,joinDate,status\r\n" +
      "EMP100,Budi,budi@x.com";

    const result = await importEmployees(csv);
    expect(result.success).toBe(true);
    expect(result.failed).toBe(1);
    expect(result.errors[0].message).toMatch(/kolom/i);
  });
});
