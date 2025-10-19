// src/db/prisma.js
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasourceUrl: process.env.PRISMA_ACCELERATE_URL, // runtime via Accelerate
});
