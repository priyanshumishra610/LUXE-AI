import { loadPrompt } from './utils/promptLoader';
import { routeLLM } from './models/modelRouter';
import { InterpretedIntent } from './interpret';

export interface Page {
  name: string;
  purpose: string;
  sections: Section[];
}

export interface Section {
  name: string;
  purpose: string;
  order: number;
}

export interface Plan {
  pages: Page[];
  navigation: string[];
  hierarchy: string[];
}

export interface PlanCandidate {
  plan: Plan;
  confidence: number;
}

async function generateSinglePlan(intent: InterpretedIntent): Promise<Plan> {
  const promptTemplate = await loadPrompt('planner');
  const intentJson = JSON.stringify(intent, null, 2);
  const fullPrompt = `${promptTemplate}\n\nInterpreted intent:\n${intentJson}\n\nOutput JSON only:`;

  const response = await routeLLM(fullPrompt, { temperature: 0.3, maxTokens: 2000 });
  
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse JSON from LLM response');
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(parsed.pages)) {
      throw new Error('Plan must include pages array');
    }

    return {
      pages: parsed.pages.map((page: any) => ({
        name: page.name || '',
        purpose: page.purpose || '',
        sections: Array.isArray(page.sections) ? page.sections : [],
      })),
      navigation: Array.isArray(parsed.navigation) ? parsed.navigation : [],
      hierarchy: Array.isArray(parsed.hierarchy) ? parsed.hierarchy : [],
    };
  } catch (error) {
    throw new Error(`Failed to parse plan: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function evaluatePlanQuality(plan: Plan): number {
  let score = 1.0;

  if (plan.pages.length === 0) {
    return 0.0;
  }

  if (plan.pages.length > 5) {
    score -= 0.3;
  }

  const totalSections = plan.pages.reduce((sum, page) => sum + page.sections.length, 0);
  if (totalSections > 15) {
    score -= 0.3;
  }

  if (plan.pages.some(page => page.sections.length > 5)) {
    score -= 0.2;
  }

  const hasEmptyPages = plan.pages.some(page => !page.name || !page.purpose);
  if (hasEmptyPages) {
    score -= 0.2;
  }

  return Math.max(0, score);
}

export async function plan(intent: InterpretedIntent): Promise<Plan> {
  return generateSinglePlan(intent);
}

export async function generatePlanCandidates(
  intent: InterpretedIntent,
  count: number
): Promise<PlanCandidate[]> {
  const candidates: PlanCandidate[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const plan = await generateSinglePlan(intent);
      const confidence = evaluatePlanQuality(plan);
      candidates.push({ plan, confidence });
    } catch (error) {
      candidates.push({
        plan: { pages: [], navigation: [], hierarchy: [] },
        confidence: 0,
      });
    }
  }

  return candidates.sort((a, b) => b.confidence - a.confidence);
}
