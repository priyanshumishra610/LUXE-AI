import { Plan } from '../plan';
import { routeLLM } from '../models/modelRouter';

export interface EarlyScreeningResult {
  pass: boolean;
  confidence: number;
  issues: string[];
}

export async function screenPlanEarly(plan: Plan): Promise<EarlyScreeningResult> {
  const planJson = JSON.stringify(plan, null, 2);
  
  const prompt = `Evaluate this site plan for early taste issues. Be strict.

Plan:
${planJson}

Check for:
1. Too many pages (>5 is suspect)
2. Too many sections per page (>5 is suspect)
3. Section stacking (multiple sections that could be one)
4. Unclear hierarchy
5. Overly complex navigation

Respond with JSON:
{
  "pass": boolean,
  "confidence": number (0-1),
  "issues": string[]
}

Reject if plan is clearly too complex or violates restraint principles.`;

  try {
    const response = await routeLLM(prompt, { temperature: 0.2, maxTokens: 500 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return {
        pass: false,
        confidence: 0.3,
        issues: ['Failed to parse screening response'],
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      pass: parsed.pass === true,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.3)),
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    };
  } catch {
    return {
      pass: false,
      confidence: 0.3,
      issues: ['Screening evaluation failed'],
    };
  }
}
