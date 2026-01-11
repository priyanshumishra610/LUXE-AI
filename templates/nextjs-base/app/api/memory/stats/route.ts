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

    const [total, approved, rejected] = await Promise.all([
      prisma.decision.count({
        where: { project: { userId } },
      }),
      prisma.decision.count({
        where: { project: { userId }, approved: true },
      }),
      prisma.decision.count({
        where: { project: { userId }, approved: false },
      }),
    ]);

    return NextResponse.json({
      total,
      approved,
      rejected,
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
