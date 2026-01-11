import { CritiqueResult } from './types';
import { join } from 'path';
import { stat } from 'fs/promises';
import { evaluateTechnical } from './critics/technicalCritic';
import { evaluateTaste, TasteCriticResult } from './critics/tasteCritic';

function convertTasteResult(tasteResult: TasteCriticResult): CritiqueResult['taste'] {
  return {
    pass: tasteResult.pass,
    scores: tasteResult.scores,
    issues: tasteResult.issues,
    cheapSignals: tasteResult.cheapSignals.length > 0 ? tasteResult.cheapSignals : undefined,
  };
}

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
          confidence: 0,
          restraint: 0,
          visualHierarchy: 0,
          cognitiveCalm: 0,
          brandSeriousness: 0,
          signatureAlignment: 0,
          copyClarity: false,
        },
        issues: ['Cannot critique non-existent output'],
      },
      overall: false,
    };
  }

  const technical = await evaluateTechnical(outputDir);
  const tasteResult = await evaluateTaste(outputDir);
  const taste = convertTasteResult(tasteResult);

  const overall = technical.pass && taste.pass;

  return {
    technical,
    taste,
    overall,
  };
}
