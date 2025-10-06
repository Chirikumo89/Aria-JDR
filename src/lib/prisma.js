import dotenv from 'dotenv';
import { PrismaClient } from '../generated/prisma/index.js';

// Charger les variables d'environnement
dotenv.config();

// Définir DATABASE_URL si elle n'est pas définie
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
