import { PrismaClient } from '@prisma/client';
import { CritiqueResult } from '../types';
import { Plan } from '../plan';
import { InterpretedIntent } from '../interpret';

const prisma = new PrismaClient();

export interface PersistDecisionParams {
  userId: string;
  intent: string;
  interpretedIntent: InterpretedIntent;
  plan: Plan;
  critiqueResult: CritiqueResult;
  approved: boolean;
  humanFeedback?: string;
}

export async function persistDecision(params: PersistDecisionParams): Promise<string> {
  const { userId, intent, interpretedIntent, plan, critiqueResult, approved, humanFeedback } = params;

  const project = await prisma.project.upsert({
    where: {
      id: `${userId}-${Date.now()}`,
    },
    create: {
      userId,
      intent,
      interpretedIntent: interpretedIntent as any,
      status: 'pending',
    },
    update: {
      intent,
      interpretedIntent: interpretedIntent as any,
    },
  });

  const decision = await prisma.decision.create({
    data: {
      projectId: project.id,
      type: 'generation',
      plan: plan as any,
      critiqueResult: critiqueResult as any,
      approved,
      humanFeedback: humanFeedback || null,
    },
  });

  const technicalReport = await prisma.criticReport.create({
    data: {
      decisionId: decision.id,
      criticType: 'technical',
      pass: critiqueResult.technical.pass,
      scores: {} as any,
      issues: critiqueResult.technical.issues,
      rationale: critiqueResult.technical.issues.join('; ') || 'No technical issues',
    },
  });

  const tasteReport = await prisma.criticReport.create({
    data: {
      decisionId: decision.id,
      criticType: 'taste',
      pass: critiqueResult.taste.pass,
      scores: critiqueResult.taste.scores as any,
      issues: critiqueResult.taste.issues,
      rationale: critiqueResult.taste.issues.join('; ') || 'Taste critique passed',
    },
  });

  const trainingSample = await prisma.trainingSample.create({
    data: {
      decisionId: decision.id,
      intent,
      plan: plan as any,
      critiqueResult: critiqueResult as any,
      approved,
      humanFeedback: humanFeedback || null,
      criticRationale: `${technicalReport.rationale}\n\n${tasteReport.rationale}`,
      label: approved ? 'approved' : 'rejected',
    },
  });

  return decision.id;
}
