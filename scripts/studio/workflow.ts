import { intake } from './intake';
import { normalize } from './normalize';
import { plan } from '../plan';
import { critique } from '../critique';
import { regenerate } from '../regenerate';
import { requestApproval } from './approval';
import { loadPrompt } from '../utils/promptLoader';
import { callLLM } from '../utils/llm';
import { writeFileToOutput } from '../utils/fileWriter';
import { logger } from '../utils/logger';
import { getAntiPatternSummary } from '../memory/antiPatterns';

async function writeGeneratedCode(generatedCode: string): Promise<void> {
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
}

export async function executeWorkflow(clientInput: string): Promise<void> {
  logger.info('Starting studio workflow');
  
  const request = await intake(clientInput);
  const interpretedIntent = await normalize(request);
  logger.info('Intent normalized');
  
  const antiPatterns = await getAntiPatternSummary();
  logger.info(antiPatterns);
  
  let sitePlan = await plan(interpretedIntent);
  logger.info('Site structure planned');
  
  const generatorPrompt = await loadPrompt('generator');
  const intentJson = JSON.stringify(interpretedIntent, null, 2);
  let attemptCount = 0;
  const maxAttempts = 2;

  while (attemptCount < maxAttempts) {
    attemptCount++;
    
    const planJson = JSON.stringify(sitePlan, null, 2);
    const fullPrompt = `${generatorPrompt}\n\nInterpreted Intent:\n${intentJson}\n\nSite Plan:\n${planJson}\n\nGenerate production-ready Next.js code:`;

    logger.info(`Generating code (attempt ${attemptCount})`);
    const generatedCode = await callLLM(fullPrompt, { maxTokens: 8000 });
    
    await writeGeneratedCode(generatedCode);
    logger.info('Code generated and written to outputs/latest');
    
    const result = await critique('');
    
    if (result.overall) {
      logger.info('Generation complete and passed critique');
      
      const approval = await requestApproval(clientInput, result);
      
      if (approval.approved) {
        logger.info('Workflow complete - approved');
        return;
      } else {
        logger.info('Workflow complete - rejected');
        return;
      }
    }

    if (attemptCount < maxAttempts) {
      logger.warn('Critique failed - regenerating');
      logger.warn(`Technical issues: ${result.technical.issues.join(', ')}`);
      logger.warn(`Taste issues: ${result.taste.issues.join(', ')}`);
      
      sitePlan = await regenerate(sitePlan, result);
      logger.info('Plan regenerated with simplifications');
    }
  }

  const finalResult = await critique('');
  
  if (!finalResult.overall) {
    logger.error('Generation failed after maximum attempts');
    logger.error(`Technical issues: ${finalResult.technical.issues.join(', ')}`);
    logger.error(`Taste issues: ${finalResult.taste.issues.join(', ')}`);
    throw new Error('Generation failed quality critique after regeneration');
  }
  
  const approval = await requestApproval(clientInput, finalResult);
  logger.info(`Workflow complete - ${approval.approved ? 'approved' : 'rejected'}`);
}
