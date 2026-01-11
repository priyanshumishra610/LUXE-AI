import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';
import { loadPrompt } from '../utils/promptLoader';
import { callLLM } from '../utils/llm';

export interface TechnicalCriticResult {
  pass: boolean;
  issues: string[];
}

export async function evaluateTechnical(outputDir: string): Promise<TechnicalCriticResult> {
  const files = await readdir(outputDir, { recursive: true });
  const codeFiles = files.filter(file => {
    const ext = extname(file);
    return ['.ts', '.tsx', '.js', '.jsx', '.css'].includes(ext);
  });

  if (codeFiles.length === 0) {
    return {
      pass: false,
      issues: ['No code files found in output'],
    };
  }

  const fileContents: string[] = [];
  for (const file of codeFiles.slice(0, 10)) {
    try {
      const content = await readFile(join(outputDir, file), 'utf-8');
      fileContents.push(`File: ${file}\n${content}`);
    } catch {
      continue;
    }
  }

  const codeSample = fileContents.join('\n\n---\n\n');
  const promptTemplate = await loadPrompt('critic-technical');
  const constitutionPath = join(process.cwd(), 'constitution', 'premium-constitution.md');
  const constitution = await readFile(constitutionPath, 'utf-8');
  
  const fullPrompt = `${promptTemplate}\n\nConstitution:\n${constitution}\n\nGenerated Code:\n${codeSample}\n\nOutput JSON with "pass" (boolean) and "issues" (array of strings):`;

  const response = await callLLM(fullPrompt, { temperature: 0.3 });
  
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      pass: false,
      issues: ['Failed to parse technical critic response'],
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      pass: parsed.pass === true,
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    };
  } catch {
    return {
      pass: false,
      issues: ['Failed to parse technical critic JSON'],
    };
  }
}
