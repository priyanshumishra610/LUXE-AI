import { loadPrompt } from './utils/promptLoader';
import { callLLM } from './utils/llm';

export interface InterpretedIntent {
  goal: string;
  audience: string;
  tone: string;
  scope: string[];
  constraints: string[];
}

export async function interpret(rawIntent: string): Promise<InterpretedIntent> {
  const promptTemplate = await loadPrompt('intent-interpreter');
  const fullPrompt = `${promptTemplate}\n\nUser input:\n${rawIntent}\n\nOutput JSON only:`;

  const response = await callLLM(fullPrompt);
  
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse JSON from LLM response');
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.goal || !parsed.audience || !parsed.tone) {
      throw new Error('Missing required fields in interpreted intent');
    }

    return {
      goal: parsed.goal,
      audience: parsed.audience,
      tone: parsed.tone,
      scope: Array.isArray(parsed.scope) ? parsed.scope : [],
      constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
    };
  } catch (error) {
    throw new Error(`Failed to parse interpreted intent: ${error instanceof Error ? error.message : String(error)}`);
  }
}
