import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function createInitialUser(email: string, password: string): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log('User already exists');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      emailVerified: new Date(),
    },
  });

  console.log('Initial user created');
}

export async function syncAntiPatterns(): Promise<void> {
  const { readAntiPatterns } = await import('../memory/memoryStore');
  const patterns = await readAntiPatterns();

  for (const pattern of patterns) {
    await prisma.antiPattern.upsert({
      where: { pattern: pattern.pattern },
      create: {
        pattern: pattern.pattern,
        category: pattern.category,
        occurrences: pattern.occurrences,
        severity: pattern.severity,
        lastSeen: new Date(pattern.lastSeen),
        examples: pattern.examples,
      },
      update: {
        occurrences: pattern.occurrences,
        severity: pattern.severity,
        lastSeen: new Date(pattern.lastSeen),
        examples: pattern.examples,
      },
    });
  }

  console.log(`Synced ${patterns.length} anti-patterns`);
}
