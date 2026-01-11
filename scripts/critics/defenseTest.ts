import { loadPrompt } from '../utils/promptLoader';
import { callLLM } from '../utils/llm';

export interface DefenseResult {
  passes: boolean;
  justification: string;
  issues: string[];
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

Output JSON with:
- passes: boolean (true only if ALL choices are justified)
- justification: string (brief explanation)
- issues: array of strings (unjustified choices)

Be strict. Premium work must justify complexity.`;

  const response = await callLLM(prompt, { temperature: 0.3 });
  
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      passes: false,
      justification: 'Failed to parse defense test response',
      issues: ['Cannot evaluate defense'],
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      passes: parsed.passes === true,
      justification: parsed.justification || '',
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    };
  } catch {
    return {
      passes: false,
      justification: 'Failed to parse defense test JSON',
      issues: ['Parse error'],
    };
  }
}
