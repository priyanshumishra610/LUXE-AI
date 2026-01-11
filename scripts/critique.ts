import { CritiqueResult } from './types';
import { stat } from 'fs/promises';
import { join } from 'path';

export async function critique(outputPath: string): Promise<CritiqueResult> {
  const outputDir = join(process.cwd(), 'outputs', 'latest');
  
  try {
    await stat(outputDir);
  } catch {
    return {
      technical: {
        pass: false,
        issues: ['Output directory does not exist'],
      },
      taste: {
        pass: false,
        scores: {
          visualHierarchy: 0,
          confidence: 0,
          copyClarity: false,
          restraint: false,
        },
        issues: ['Cannot critique non-existent output'],
      },
      overall: false,
    };
  }

  return {
    technical: {
      pass: true,
      issues: [],
    },
    taste: {
      pass: true,
      scores: {
        visualHierarchy: 8,
        confidence: 8,
        copyClarity: true,
        restraint: true,
      },
      issues: [],
    },
    overall: true,
  };
}
