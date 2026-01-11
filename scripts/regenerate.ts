import { CritiqueResult } from './types';
import { Plan } from './plan';
import { loadPrompt } from './utils/promptLoader';
import { routeLLM } from './models/modelRouter';

export async function regenerate(
  previousPlan: Plan,
  critiqueResult: CritiqueResult
): Promise<Plan> {
  if (critiqueResult.taste.severity === 'fatal') {
    throw new Error('Cannot regenerate on fatal taste failure - escalate to human');
  }

  const technicalIssues = critiqueResult.technical.issues.join('\n');
  const tasteIssues = critiqueResult.taste.issues.join('\n');
  const scores = critiqueResult.taste.scores;
  const tasteScores = `Confidence: ${scores.confidence}/10\nRestraint: ${scores.restraint}/10\nVisual Hierarchy: ${scores.visualHierarchy}/10\nCognitive Calm: ${scores.cognitiveCalm}/10\nBrand Seriousness: ${scores.brandSeriousness}/10\nSignature Alignment: ${scores.signatureAlignment}/10\nCopy Clarity: ${scores.copyClarity}`;
  const severity = critiqueResult.taste.severity || 'major';

  const planJson = JSON.stringify(previousPlan, null, 2);
  const feedback = `Technical Issues:\n${technicalIssues}\n\nTaste Issues:\n${tasteIssues}\n\nTaste Scores:\n${tasteScores}\n\nSeverity: ${severity}`;

  const regenerationPrompt = `You are the Regeneration Agent for LUXE AI.

Your task: Simplify the site structure based on critique feedback. Be aggressive about subtraction.

Previous Plan:
${planJson}

Critique Feedback:
${feedback}

CRITICAL RULES:
- Prefer removing elements over adding
- Remove sections aggressively
- Simplify structure drastically
- Address technical issues
- Improve taste scores by removing unnecessary elements
- Never add visual noise to fix issues
- Remove decorative elements
- Reduce copy length
- Eliminate section stacking
- One dominant narrative only

Output JSON with the simplified plan (same structure as input):`;

  const response = await routeLLM(regenerationPrompt, { temperature: 0.3, maxTokens: 2000 });
  
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse regeneration response');
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(parsed.pages)) {
      throw new Error('Regenerated plan must include pages array');
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
    throw new Error(`Failed to parse regenerated plan: ${error instanceof Error ? error.message : String(error)}`);
  }
}
