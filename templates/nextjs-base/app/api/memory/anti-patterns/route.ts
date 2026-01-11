import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getUserId(request: NextRequest): Promise<string | null> {
  const sessionToken = request.cookies.get('session')?.value;
  if (!sessionToken) return null;

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session.userId;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const antiPatterns = await prisma.antiPattern.findMany({
      orderBy: { lastSeen: 'desc' },
      take: 50,
    });

    return NextResponse.json(antiPatterns);
  } catch (error) {
    console.error('Failed to fetch anti-patterns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch anti-patterns' },
      { status: 500 }
    );
  }
}
