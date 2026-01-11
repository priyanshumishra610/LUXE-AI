import { interpret } from './interpret';
import { plan, generatePlanCandidates } from './plan';
import { critique } from './critique';
import { regenerate } from './regenerate';
import { classifyTask } from './intelligence/taskClassifier';
import { estimateDifficulty } from './intelligence/difficultyEstimator';
import { selectStrategy } from './intelligence/strategySelector';
import { ConfidenceTracker } from './intelligence/confidenceTracker';
import { evaluateEscalation } from './intelligence/escalationPolicy';
import { screenPlanEarly } from './intelligence/earlyTasteScreening';
import { loadPrompt } from './utils/promptLoader';
import { routeLLM } from './models/modelRouter';
import { writeFileToOutput } from './utils/fileWriter';
import { logger } from './utils/logger';

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

export async function generate(rawIntent: string): Promise<void> {
  logger.info('Starting generation process');
  
  const confidence = new ConfidenceTracker();
  
  const interpretedIntent = await interpret(rawIntent);
  logger.info('Intent interpreted');
  
  const classification = classifyTask(interpretedIntent);
  confidence.updateClassification(classification.confidence);
  
  const difficulty = estimateDifficulty(interpretedIntent, classification);
  const strategy = selectStrategy(difficulty);
  
  logger.info(`Strategy: ${strategy.planCount} plans, ${strategy.maxRegenerations} max regens, ${strategy.strictnessLevel} strictness`);
  
  let sitePlan = await plan(interpretedIntent);
  
  if (strategy.planCount > 1) {
    const candidates = await generatePlanCandidates(interpretedIntent, strategy.planCount);
    
    if (strategy.earlyRejectionEnabled) {
      for (const candidate of candidates) {
        const screening = await screenPlanEarly(candidate.plan);
        if (screening.pass && screening.confidence > 0.6) {
          sitePlan = candidate.plan;
          confidence.updatePlanning(screening.confidence);
          break;
        }
      }
    } else {
      sitePlan = candidates[0].plan;
      confidence.updatePlanning(candidates[0].confidence);
    }
  } else {
    confidence.updatePlanning(0.7);
  }
  
  logger.info('Site structure planned');
  
  const generatorPrompt = await loadPrompt('generator');
  const intentJson = JSON.stringify(interpretedIntent, null, 2);
  let attemptCount = 0;
  const maxAttempts = strategy.maxRegenerations;

  while (attemptCount < maxAttempts) {
    attemptCount++;
    
    const escalation = evaluateEscalation(confidence, difficulty, null, attemptCount, maxAttempts);
    if (escalation.shouldEscalate) {
      logger.error(`Escalation triggered: ${escalation.reason}`);
      throw new Error(`Generation escalated: ${escalation.reason}`);
    }
    
    const planJson = JSON.stringify(sitePlan, null, 2);
    const fullPrompt = `${generatorPrompt}\n\nInterpreted Intent:\n${intentJson}\n\nSite Plan:\n${planJson}\n\nGenerate production-ready Next.js code:`;

    logger.info(`Generating code (attempt ${attemptCount})`);
    const generatedCode = await routeLLM(fullPrompt, { maxTokens: 8000 });
    
    await writeGeneratedCode(generatedCode);
    logger.info('Code generated and written to outputs/latest');
    
    const result = await critique('');
    confidence.updateCritique(result.overall ? 0.8 : 0.3);
    
    if (result.overall) {
      logger.info('Generation complete and passed critique');
      return;
    }

    const escalationAfterCritique = evaluateEscalation(confidence, difficulty, result, attemptCount, maxAttempts);
    if (escalationAfterCritique.shouldEscalate) {
      logger.error(`Escalation triggered after critique: ${escalationAfterCritique.reason}`);
      throw new Error(`Generation escalated: ${escalationAfterCritique.reason}`);
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
  confidence.updateCritique(finalResult.overall ? 0.8 : 0.2);
  
  const finalEscalation = evaluateEscalation(confidence, difficulty, finalResult, attemptCount, maxAttempts);
  if (finalEscalation.shouldEscalate) {
    logger.error(`Final escalation: ${finalEscalation.reason}`);
    throw new Error(`Generation escalated: ${finalEscalation.reason}`);
  }
  
  logger.error('Generation failed after maximum attempts');
  logger.error(`Technical issues: ${finalResult.technical.issues.join(', ')}`);
  logger.error(`Taste issues: ${finalResult.taste.issues.join(', ')}`);
  throw new Error('Generation failed quality critique after regeneration');
}
