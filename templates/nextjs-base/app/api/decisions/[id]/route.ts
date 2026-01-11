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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decision = await prisma.decision.findFirst({
      where: {
        id: params.id,
        project: { userId },
      },
      include: {
        criticReports: true,
      },
    });

    if (!decision) {
      return NextResponse.json(
        { error: 'Decision not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(decision);
  } catch (error) {
    console.error('Failed to fetch decision:', error);
    return NextResponse.json(
      { error: 'Failed to fetch decision' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decision = await prisma.decision.findFirst({
      where: {
        id: params.id,
        project: { userId },
      },
    });

    if (!decision) {
      return NextResponse.json(
        { error: 'Decision not found' },
        { status: 404 }
      );
    }

    const { approved, humanFeedback } = await request.json();

    await prisma.decision.update({
      where: { id: params.id },
      data: {
        approved,
        humanFeedback: humanFeedback || null,
      },
    });

    await prisma.project.update({
      where: { id: decision.projectId },
      data: {
        status: approved ? 'approved' : 'rejected',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update decision:', error);
    return NextResponse.json(
      { error: 'Failed to update decision' },
      { status: 500 }
    );
  }
}
