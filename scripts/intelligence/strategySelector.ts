import { DifficultyEstimate } from './difficultyEstimator';

export interface GenerationStrategy {
  planCount: number;
  maxRegenerations: number;
  strictnessLevel: 'strict' | 'moderate' | 'lenient';
  earlyRejectionEnabled: boolean;
}

export function selectStrategy(difficulty: DifficultyEstimate): GenerationStrategy {
  const { complexity, risk } = difficulty;

  let planCount: number;
  let maxRegenerations: number;
  let strictnessLevel: 'strict' | 'moderate' | 'lenient';
  let earlyRejectionEnabled: boolean;

  if (complexity > 0.7 || risk > 0.7) {
    planCount = 3;
    maxRegenerations = 1;
    strictnessLevel = 'strict';
    earlyRejectionEnabled = true;
  } else if (complexity > 0.4 || risk > 0.4) {
    planCount = 2;
    maxRegenerations = 2;
    strictnessLevel = 'moderate';
    earlyRejectionEnabled = true;
  } else {
    planCount = 2;
    maxRegenerations = 2;
    strictnessLevel = 'moderate';
    earlyRejectionEnabled = false;
  }

  return {
    planCount,
    maxRegenerations,
    strictnessLevel,
    earlyRejectionEnabled,
  };
}
