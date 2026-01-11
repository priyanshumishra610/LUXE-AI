import { loadPrompt } from './utils/promptLoader';
import { callLLM } from './utils/llm';
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

export async function plan(intent: InterpretedIntent): Promise<Plan> {
  const promptTemplate = await loadPrompt('planner');
  const intentJson = JSON.stringify(intent, null, 2);
  const fullPrompt = `${promptTemplate}\n\nInterpreted intent:\n${intentJson}\n\nOutput JSON only:`;

  const response = await callLLM(fullPrompt);
  
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
