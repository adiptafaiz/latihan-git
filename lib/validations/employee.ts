import { z } from "zod";

export const employeeStatusEnum = z.enum(["ACTIVE", "INACTIVE"]);

export const DEPARTMENTS = [
  "Engineering",
  "Human Resources",
  "Finance",
  "Marketing",
  "Operations",
  "Sales",
] as const;

export const employeeSchema = z.object({
  nip: z
    .string()
    .min(1, "NIP wajib diisi")
    .max(30, "NIP maksimal 30 karakter")
    .regex(/^[A-Za-z0-9\-]+$/, "NIP hanya huruf, angka, dan strip"),
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  phone: z
    .string()
    .max(20, "Telepon maksimal 20 karakter")
    .optional()
    .or(z.literal("")),
  position: z.string().min(1, "Jabatan wajib diisi").max(80, "Jabatan maksimal 80 karakter"),
  department: z
    .string()
    .min(1, "Departemen wajib diisi")
    .max(80, "Departemen maksimal 80 karakter"),
  joinDate: z.coerce.date({
    required_error: "Tanggal bergabung wajib diisi",
    invalid_type_error: "Tanggal tidak valid",
  }),
  status: employeeStatusEnum.default("ACTIVE"),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;

/** Field-level error map: { nip?: string[], email?: string[], ... } */
export type EmployeeFieldErrors = Partial<Record<keyof EmployeeInput, string[]>>;
