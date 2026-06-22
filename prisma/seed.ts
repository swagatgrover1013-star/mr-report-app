import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";
import { realUsers, realProducts, realStockists, realChemists, realDoctors } from "../src/data/seed";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding users...");
  for (const u of realUsers) {
    const password = u.email.split("@")[0];
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
      where: { id: u.id },
      create: { ...u, passwordHash },
      update: {},
    });
  }

  console.log("Seeding products...");
  for (const p of realProducts) {
    await prisma.product.upsert({ where: { id: p.id }, create: p, update: {} });
  }

  console.log("Seeding stockists...");
  for (const s of realStockists) {
    await prisma.stockist.upsert({ where: { id: s.id }, create: s, update: {} });
  }

  console.log("Seeding chemists...");
  for (const c of realChemists) {
    await prisma.chemist.upsert({ where: { id: c.id }, create: c, update: {} });
  }

  console.log("Seeding doctors...");
  for (const d of realDoctors) {
    await prisma.doctor.upsert({ where: { id: d.id }, create: d, update: {} });
  }

  console.log(`Done. ${realUsers.length} users, ${realDoctors.length} doctors, ${realChemists.length} chemists, ${realStockists.length} stockists, ${realProducts.length} products.`);
  console.log("Each user's password is the part of their email before the @ (e.g. amit@aurelderma.com -> amit). Change these before going live.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
