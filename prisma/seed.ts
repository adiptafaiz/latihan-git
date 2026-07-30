import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.employee.deleteMany({});
  await prisma.user.deleteMany({});

  // Admin user default
  const hashed = await bcrypt.hash("admin123", 12);
  await prisma.user.create({
    data: {
      email: "admin@perusahaan.com",
      name: "Administrator",
      password: hashed,
      role: "admin",
    },
  });
  console.log("✅ Admin user dibuat: admin@perusahaan.com / admin123");

  await prisma.employee.createMany({
    data: [
      {
        nip: "EMP001",
        name: "Budi Santoso",
        email: "budi@perusahaan.com",
        phone: "081234567890",
        position: "Software Engineer",
        department: "Engineering",
        joinDate: new Date("2023-01-15"),
        status: "ACTIVE",
      },
      {
        nip: "EMP002",
        name: "Siti Aminah",
        email: "siti@perusahaan.com",
        phone: "081298765432",
        position: "HR Officer",
        department: "Human Resources",
        joinDate: new Date("2022-06-01"),
        status: "ACTIVE",
      },
      {
        nip: "EMP003",
        name: "Andi Wijaya",
        email: "andi@perusahaan.com",
        position: "Finance Staff",
        department: "Finance",
        joinDate: new Date("2021-03-20"),
        status: "INACTIVE",
      },
      {
        nip: "EMP004",
        name: "Dewi Lestari",
        email: "dewi@perusahaan.com",
        phone: "081311112222",
        position: "Marketing Specialist",
        department: "Marketing",
        joinDate: new Date("2023-09-05"),
        status: "ACTIVE",
      },
      {
        nip: "EMP005",
        name: "Rudi Hartono",
        email: "rudi@perusahaan.com",
        phone: "081455566677",
        position: "Operations Lead",
        department: "Operations",
        joinDate: new Date("2020-11-12"),
        status: "ACTIVE",
      },
      {
        nip: "EMP006",
        name: "Maya Sari",
        email: "maya@perusahaan.com",
        position: "Sales Executive",
        department: "Sales",
        joinDate: new Date("2024-02-19"),
        status: "ACTIVE",
      },
      {
        nip: "EMP007",
        name: "Joko Prasetyo",
        email: "joko@perusahaan.com",
        phone: "081788899900",
        position: "Senior Engineer",
        department: "Engineering",
        joinDate: new Date("2019-07-01"),
        status: "INACTIVE",
      },
      {
        nip: "EMP008",
        name: "Nur Hidayah",
        email: "nur@perusahaan.com",
        position: "Recruiter",
        department: "Human Resources",
        joinDate: new Date("2023-04-10"),
        status: "ACTIVE",
      },
    ],
  });

  console.log("✅ Seeding selesai.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
