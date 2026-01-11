import { InterpretedIntent } from '../interpret';
import { TaskClassification } from './taskClassifier';

export interface DifficultyEstimate {
  complexity: number;
  risk: number;
  factors: string[];
}

const COMPLEXITY_FACTORS = {
  scopeSize: (scope: string[]) => Math.min(scope.length / 5, 1.0),
  constraintCount: (constraints: string[]) => Math.min(constraints.length / 3, 1.0),
  goalLength: (goal: string) => Math.min(goal.length / 200, 1.0),
  taskType: (type: string) => {
    const weights: Record<string, number> = {
      landing: 0.3,
      product: 0.5,
      brand: 0.4,
      ecommerce: 0.8,
      portfolio: 0.6,
      unknown: 0.7,
    };
    return weights[type] || 0.5;
  },
};

const RISK_FACTORS = {
  vagueGoal: (goal: string) => goal.length < 50 ? 0.6 : 0.2,
  manyConstraints: (constraints: string[]) => Math.min(constraints.length / 4, 0.8),
  ambiguousScope: (scope: string[]) => scope.length === 0 ? 0.5 : 0.2,
  lowClassificationConfidence: (confidence: number) => 1.0 - confidence,
};

export function estimateDifficulty(
  intent: InterpretedIntent,
  classification: TaskClassification
): DifficultyEstimate {
  const factors: string[] = [];
  
  const scopeComplexity = COMPLEXITY_FACTORS.scopeSize(intent.scope);
  const constraintComplexity = COMPLEXITY_FACTORS.constraintCount(intent.constraints);
  const goalComplexity = COMPLEXITY_FACTORS.goalLength(intent.goal);
  const typeComplexity = COMPLEXITY_FACTORS.taskType(classification.type);

  const complexity = (scopeComplexity * 0.3 + constraintComplexity * 0.2 + goalComplexity * 0.2 + typeComplexity * 0.3);
  
  if (scopeComplexity > 0.6) factors.push('large-scope');
  if (constraintComplexity > 0.6) factors.push('many-constraints');
  if (typeComplexity > 0.7) factors.push('complex-task-type');

  const vagueRisk = RISK_FACTORS.vagueGoal(intent.goal);
  const constraintRisk = RISK_FACTORS.manyConstraints(intent.constraints);
  const scopeRisk = RISK_FACTORS.ambiguousScope(intent.scope);
  const confidenceRisk = RISK_FACTORS.lowClassificationConfidence(classification.confidence);

  const risk = Math.min(vagueRisk * 0.3 + constraintRisk * 0.2 + scopeRisk * 0.2 + confidenceRisk * 0.3, 1.0);
  
  if (vagueRisk > 0.5) factors.push('vague-goal');
  if (constraintRisk > 0.5) factors.push('constraint-risk');
  if (scopeRisk > 0.4) factors.push('ambiguous-scope');
  if (confidenceRisk > 0.5) factors.push('low-classification-confidence');

  return {
    complexity: Math.round(complexity * 100) / 100,
    risk: Math.round(risk * 100) / 100,
    factors,
  };
}
