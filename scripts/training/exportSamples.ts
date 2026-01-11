import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

interface TrainingSample {
  intent: string;
  plan: any;
  critiqueResult: any;
  approved: boolean;
  humanFeedback: string | null;
  criticRationale: string;
  label: string;
}

export async function exportApprovedSamples(outputPath: string): Promise<number> {
  const samples = await prisma.trainingSample.findMany({
    where: {
      exported: false,
      approved: true,
    },
    include: {
      decision: {
        include: {
          criticReports: true,
        },
      },
    },
    take: 1000,
  });

  const trainingData: TrainingSample[] = samples.map((sample) => {
    const rationale = sample.decision.criticReports
      .map((report) => `${report.criticType}: ${report.rationale}`)
      .join('\n\n');

    return {
      intent: sample.intent,
      plan: sample.plan,
      critiqueResult: sample.critiqueResult,
      approved: sample.approved,
      humanFeedback: sample.humanFeedback,
      criticRationale: rationale,
      label: sample.label,
    };
  });

  const jsonContent = JSON.stringify(trainingData, null, 2);
  await writeFile(outputPath, jsonContent, 'utf-8');

  await prisma.trainingSample.updateMany({
    where: {
      id: { in: samples.map((s) => s.id) },
    },
    data: {
      exported: true,
      exportedAt: new Date(),
    },
  });

  return samples.length;
}

export async function exportRejectedSamples(outputPath: string): Promise<number> {
  const samples = await prisma.trainingSample.findMany({
    where: {
      exported: false,
      approved: false,
    },
    include: {
      decision: {
        include: {
          criticReports: true,
        },
      },
    },
    take: 1000,
  });

  const trainingData: TrainingSample[] = samples.map((sample) => {
    const rationale = sample.decision.criticReports
      .map((report) => `${report.criticType}: ${report.rationale}`)
      .join('\n\n');

    return {
      intent: sample.intent,
      plan: sample.plan,
      critiqueResult: sample.critiqueResult,
      approved: sample.approved,
      humanFeedback: sample.humanFeedback,
      criticRationale: rationale,
      label: sample.label,
    };
  });

  const jsonContent = JSON.stringify(trainingData, null, 2);
  await writeFile(outputPath, jsonContent, 'utf-8');

  await prisma.trainingSample.updateMany({
    where: {
      id: { in: samples.map((s) => s.id) },
    },
    data: {
      exported: true,
      exportedAt: new Date(),
    },
  });

  return samples.length;
}

export async function exportAllSamples(outputDir: string): Promise<void> {
  const approvedPath = join(outputDir, 'approved-samples.json');
  const rejectedPath = join(outputDir, 'rejected-samples.json');

  const [approvedCount, rejectedCount] = await Promise.all([
    exportApprovedSamples(approvedPath),
    exportRejectedSamples(rejectedPath),
  ]);

  console.log(`Exported ${approvedCount} approved samples`);
  console.log(`Exported ${rejectedCount} rejected samples`);
}
