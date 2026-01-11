import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

interface GemmaTrainingExample {
  instruction: string;
  input: string;
  output: string;
}

function buildInstruction(sample: any): string {
  return `Generate a premium site plan based on the user's intent. The plan must pass strict taste and technical critique.`;
}

function buildInput(sample: any): string {
  return `Intent: ${sample.intent}\n\nCritique Requirements:\n- Confidence: 8+/10\n- Restraint: 8+/10\n- Visual Hierarchy: 8+/10\n- Cognitive Calm: 8+/10\n- Brand Seriousness: 8+/10\n- Signature Alignment: 8+/10\n- Copy Clarity: true`;
}

function buildOutput(sample: any): string {
  const planJson = JSON.stringify(sample.plan, null, 2);
  const rationale = sample.criticRationale || 'No rationale available';
  
  return `Plan:\n${planJson}\n\nCritic Rationale:\n${rationale}\n\nHuman Feedback: ${sample.humanFeedback || 'None'}\n\nLabel: ${sample.label}`;
}

export async function buildGemmaDataset(outputPath: string): Promise<number> {
  const samples = await prisma.trainingSample.findMany({
    where: {
      exported: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5000,
  });

  const examples: GemmaTrainingExample[] = samples.map((sample) => ({
    instruction: buildInstruction(sample),
    input: buildInput(sample),
    output: buildOutput(sample),
  }));

  const dataset = {
    version: '1.0',
    description: 'LUXE AI training dataset for Gemma fine-tuning',
    examples: examples,
    metadata: {
      totalSamples: examples.length,
      approvedCount: samples.filter((s) => s.approved).length,
      rejectedCount: samples.filter((s) => !s.approved).length,
      createdAt: new Date().toISOString(),
    },
  };

  const jsonContent = JSON.stringify(dataset, null, 2);
  await writeFile(outputPath, jsonContent, 'utf-8');

  return examples.length;
}

export async function buildLabeledDataset(outputDir: string): Promise<void> {
  const approvedSamples = await prisma.trainingSample.findMany({
    where: {
      exported: true,
      approved: true,
    },
    take: 2000,
  });

  const rejectedSamples = await prisma.trainingSample.findMany({
    where: {
      exported: true,
      approved: false,
    },
    take: 2000,
  });

  const approvedExamples = approvedSamples.map((sample) => ({
    instruction: buildInstruction(sample),
    input: buildInput(sample),
    output: buildOutput(sample),
    label: 'approved',
  }));

  const rejectedExamples = rejectedSamples.map((sample) => ({
    instruction: buildInstruction(sample),
    input: buildInput(sample),
    output: buildOutput(sample),
    label: 'rejected',
  }));

  const approvedPath = join(outputDir, 'gemma-approved.json');
  const rejectedPath = join(outputDir, 'gemma-rejected.json');

  await Promise.all([
    writeFile(
      approvedPath,
      JSON.stringify({ examples: approvedExamples }, null, 2),
      'utf-8'
    ),
    writeFile(
      rejectedPath,
      JSON.stringify({ examples: rejectedExamples }, null, 2),
      'utf-8'
    ),
  ]);

  console.log(`Built ${approvedExamples.length} approved examples`);
  console.log(`Built ${rejectedExamples.length} rejected examples`);
}
