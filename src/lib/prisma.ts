import { PrismaClient } from "@prisma/client";

let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // @ts-ignore
  if (!global.prisma) {
    // @ts-ignore
    global.prisma = new PrismaClient();
  }

  // @ts-ignore
  prisma = global.prisma;
}

// @ts-ignore
export const prismaClient = global.prisma as PrismaClient;
