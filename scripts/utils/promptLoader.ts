import { readFile } from 'fs/promises';
import { join } from 'path';

export async function loadPrompt(name: string): Promise<string> {
  const promptPath = join(process.cwd(), 'prompts', `${name}.prompt.txt`);
  try {
    return await readFile(promptPath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to load prompt "${name}": ${error instanceof Error ? error.message : String(error)}`);
  }
}
