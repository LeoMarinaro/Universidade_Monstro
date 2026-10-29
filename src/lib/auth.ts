import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
// Relative import (not "@/lib/prisma") so the Better Auth CLI can load this file too
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    // Our own columns on the user table, next to Better Auth's core ones
    additionalFields: {
      phone: { type: "string", required: false, unique: true },
      // input: false = the server sets these; sign-up requests can't
      isSuperAdmin: { type: "boolean", required: false, defaultValue: false, input: false },
      deletedAt: { type: "date", required: false, input: false },
    },
  },
  // Lets server actions set the session cookie; must stay the last plugin
  plugins: [nextCookies()],
});
