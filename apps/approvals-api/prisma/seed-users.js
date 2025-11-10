// prisma/seed-users.js
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function upsertUser({ name, email, role, password }) {
  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.upsert({
    where: { email }, // email must be unique in your schema
    update: {
      name,
      role,
      passwordHash,        // ✅ correct field
      isActive: true,
      mustChangePassword: false, // if your schema has it
    },
    create: {
      name,
      email,
      role,
      passwordHash,        // ✅ correct field
      isActive: true,
      mustChangePassword: false, // if present in schema
    },
  });
}

async function main() {
  const users = [
    { name: "Manager Ali",   email: "manager_ali@demo.local", role: "MANAGER",  password: "manager123" },
    { name: "Director Sara", email: "director_sara@demo.local", role: "DIRECTOR", password: "director123" },
    { name: "Admin",         email: "admin@demo.local",        role: "ADMIN",    password: "admin123" },
    { name: "Employee",      email: "employee@demo.local",     role: "EMPLOYEE", password: "employee123" },
  ];

  for (const u of users) {
    const res = await upsertUser(u);
    console.log(`Seeded: ${res.email} (${res.role})`);
  }
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
