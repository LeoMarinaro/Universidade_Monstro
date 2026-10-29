// Prisma CLI configuration (migrate, generate). Prisma 7 reads the
// connection URL from here instead of from schema.prisma.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations need a direct connection; the app itself uses the pooled
    // DATABASE_URL (see src/lib/prisma.ts). Undefined is fine for `prisma generate`,
    // which doesn't touch the database.
    url: process.env.DATABASE_URL_UNPOOLED,
  },
});
