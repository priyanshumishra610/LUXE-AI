import { interpret } from './interpret';
import { plan } from './plan';
import { critique } from './critique';
import { loadPrompt } from './utils/promptLoader';
import { callLLM } from './utils/llm';
import { writeFileToOutput } from './utils/fileWriter';
import { logger } from './utils/logger';

export async function generate(rawIntent: string): Promise<void> {
  logger.info('Starting generation process');
  
  const interpretedIntent = await interpret(rawIntent);
  logger.info('Intent interpreted');
  
  const sitePlan = await plan(interpretedIntent);
  logger.info('Site structure planned');
  
  const generatorPrompt = await loadPrompt('generator');
  const planJson = JSON.stringify(sitePlan, null, 2);
  const intentJson = JSON.stringify(interpretedIntent, null, 2);
  const fullPrompt = `${generatorPrompt}\n\nInterpreted Intent:\n${intentJson}\n\nSite Plan:\n${planJson}\n\nGenerate production-ready Next.js code:`;

  logger.info('Generating code');
  const generatedCode = await callLLM(fullPrompt, { maxTokens: 8000 });
  
  const codeBlockRegex = /```(?:[\w]+)?\n([\s\S]*?)```/g;
  const matches = [...generatedCode.matchAll(codeBlockRegex)];
  
  if (matches.length === 0) {
    throw new Error('No code blocks found in generator response');
  }

  for (let i = 0; i < matches.length; i++) {
    const content = matches[i][1].trim();
    const pathMatch = content.match(/\/\/\s*File:\s*([^\n]+)/);
    const fileName = pathMatch ? pathMatch[1].trim() : `file${i}.tsx`;
    
    await writeFileToOutput(fileName, content);
  }

  logger.info('Code generated and written to outputs/latest');
  
  const result = await critique('');
  if (!result.overall) {
    logger.error('Critique failed - stopping generation');
    logger.error(`Technical issues: ${result.technical.issues.join(', ')}`);
    logger.error(`Taste issues: ${result.taste.issues.join(', ')}`);
    throw new Error('Generation failed quality critique');
  }

  logger.info('Generation complete and passed critique');
}
