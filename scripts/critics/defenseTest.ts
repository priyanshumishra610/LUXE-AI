import { loadPrompt } from '../utils/promptLoader';
import { callLLM } from '../utils/llm';

export interface DefenseResult {
  passes: boolean;
  justification: string;
  issues: string[];
  severity: 'minor' | 'major' | 'fatal';
}

export async function testDefense(code: string, structure: string): Promise<DefenseResult> {
  const prompt = `You are a Defense Test evaluator for LUXE AI.

Your task: Determine if the design choices can be justified over simpler alternatives.

Code Structure:
${structure}

Generated Code:
${code.substring(0, 5000)}

For each significant design choice (sections, components, layout, colors, typography):
1. Can this be justified over a simpler alternative?
2. Is this choice necessary or decorative?
3. Does this serve a clear purpose?

Classify failures:
- fatal: Cannot be justified, fundamentally wrong direction
- major: Multiple unjustified choices, significant waste
- minor: One or two questionable choices

Output JSON with:
- passes: boolean (true only if ALL choices are justified)
- justification: string (brief explanation)
- issues: array of strings (unjustified choices)
- severity: string (fatal/major/minor if fails)

Be strict. Premium work must justify complexity.`;

  const response = await callLLM(prompt, { temperature: 0.3 });
  
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      passes: false,
      justification: 'Failed to parse defense test response',
      issues: ['Cannot evaluate defense'],
      severity: 'fatal',
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const severity = parsed.severity || 'major';
    return {
      passes: parsed.passes === true,
      justification: parsed.justification || '',
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      severity: severity === 'fatal' || severity === 'major' || severity === 'minor' ? severity : 'major',
    };
  } catch {
    return {
      passes: false,
      justification: 'Failed to parse defense test JSON',
      issues: ['Parse error'],
      severity: 'fatal',
    };
  }
}
