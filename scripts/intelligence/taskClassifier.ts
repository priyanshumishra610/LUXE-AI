import { InterpretedIntent } from '../interpret';

export type TaskType = 'landing' | 'product' | 'brand' | 'ecommerce' | 'portfolio' | 'unknown';

export interface TaskClassification {
  type: TaskType;
  confidence: number;
  indicators: string[];
}

const TASK_PATTERNS: Record<TaskType, string[]> = {
  landing: ['landing', 'homepage', 'home page', 'main page', 'entry', 'intro'],
  product: ['product', 'feature', 'service', 'offering', 'solution'],
  brand: ['brand', 'identity', 'story', 'about', 'company', 'mission'],
  ecommerce: ['shop', 'store', 'cart', 'checkout', 'buy', 'purchase', 'catalog'],
  portfolio: ['portfolio', 'work', 'projects', 'gallery', 'showcase'],
  unknown: [],
};

export function classifyTask(intent: InterpretedIntent): TaskClassification {
  const text = `${intent.goal} ${intent.audience} ${intent.scope.join(' ')}`.toLowerCase();
  const scores: Record<TaskType, number> = {
    landing: 0,
    product: 0,
    brand: 0,
    ecommerce: 0,
    portfolio: 0,
    unknown: 0,
  };

  const indicators: string[] = [];

  for (const [type, patterns] of Object.entries(TASK_PATTERNS)) {
    if (type === 'unknown') continue;
    
    for (const pattern of patterns) {
      if (text.includes(pattern)) {
        scores[type as TaskType] += 1;
        indicators.push(`${type}:${pattern}`);
      }
    }
  }

  const maxScore = Math.max(...Object.values(scores));
  const primaryType = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as TaskType || 'unknown';
  
  const totalMatches = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalMatches > 0 ? Math.min(maxScore / totalMatches, 1.0) : 0.3;

  return {
    type: primaryType,
    confidence,
    indicators,
  };
}
