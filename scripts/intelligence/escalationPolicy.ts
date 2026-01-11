import { ConfidenceTracker } from './confidenceTracker';
import { CritiqueResult } from '../types';
import { DifficultyEstimate } from './difficultyEstimator';

export interface EscalationDecision {
  shouldEscalate: boolean;
  reason: string | null;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export function evaluateEscalation(
  confidence: ConfidenceTracker,
  difficulty: DifficultyEstimate,
  critiqueResult: CritiqueResult | null,
  attemptCount: number,
  maxAttempts: number
): EscalationDecision {
  if (confidence.isCritical()) {
    return {
      shouldEscalate: true,
      reason: 'critical-confidence',
      urgency: 'critical',
    };
  }

  if (critiqueResult?.taste.severity === 'fatal') {
    return {
      shouldEscalate: true,
      reason: 'fatal-taste-failure',
      urgency: 'high',
    };
  }

  if (attemptCount >= maxAttempts && critiqueResult && !critiqueResult.overall) {
    return {
      shouldEscalate: true,
      reason: 'max-attempts-exceeded',
      urgency: 'high',
    };
  }

  if (confidence.isLow() && attemptCount >= Math.ceil(maxAttempts / 2)) {
    return {
      shouldEscalate: true,
      reason: 'low-confidence-early',
      urgency: 'medium',
    };
  }

  if (difficulty.risk > 0.8 && attemptCount > 0) {
    return {
      shouldEscalate: true,
      reason: 'high-risk-early',
      urgency: 'medium',
    };
  }

  return {
    shouldEscalate: false,
    reason: null,
    urgency: 'low',
  };
}
