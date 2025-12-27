import { PrismaClient } from '@prisma/client';

// This prevents multiple instances of Prisma Client in development
// due to Next.js Hot Module Replacement (HMR).
declare global {
  var prisma: PrismaClient | undefined;
}

// FIX: Replaced `global` with `globalThis` for better cross-environment compatibility.
const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') {
  // FIX: Replaced `global` with `globalThis` for better cross-environment compatibility.
  globalThis.prisma = prisma;
}

export default prisma;
