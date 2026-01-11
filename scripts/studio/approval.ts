import * as readline from 'readline';
import { CritiqueResult } from '../types';
import { recordApproval } from '../memory/approvalMemory';
import { recordRejection } from '../memory/rejectionMemory';
import { logger } from '../utils/logger';

function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

export async function requestApproval(
  intent: string,
  critiqueResult: CritiqueResult
): Promise<{ approved: boolean; feedback?: string }> {
  logger.info('\n--- Approval Request ---');
  logger.info(`Intent: ${intent}`);
  logger.info(`Technical: ${critiqueResult.technical.pass ? 'PASS' : 'FAIL'}`);
  logger.info(`Taste: ${critiqueResult.taste.pass ? 'PASS' : 'FAIL'}`);
  
  if (critiqueResult.taste.pass) {
    const scores = critiqueResult.taste.scores;
    logger.info(`Scores - Confidence: ${scores.confidence}/10, Restraint: ${scores.restraint}/10, Hierarchy: ${scores.visualHierarchy}/10`);
  }
  
  logger.info('Output available in outputs/latest');
  logger.info('');
  
  const rl = createReadlineInterface();
  
  try {
    const response = await question(rl, 'Approve? (approve/reject): ');
    const decision = response.trim().toLowerCase();
    
    if (decision === 'approve' || decision === 'a') {
      const feedback = await question(rl, 'Optional feedback: ');
      await recordApproval(intent, critiqueResult, feedback.trim() || undefined);
      logger.info('Approved and recorded');
      return { approved: true, feedback: feedback.trim() || undefined };
    }
    
    if (decision === 'reject' || decision === 'r') {
      const feedback = await question(rl, 'Rejection reason (required): ');
      
      if (!feedback.trim()) {
        throw new Error('Rejection feedback is required');
      }
      
      const criticDisagreement = critiqueResult.overall 
        ? 'Critics passed but human rejected'
        : undefined;
      
      await recordRejection(intent, critiqueResult, feedback.trim(), criticDisagreement);
      logger.info('Rejected and recorded');
      return { approved: false, feedback: feedback.trim() };
    }
    
    throw new Error('Invalid response. Use "approve" or "reject"');
  } finally {
    rl.close();
  }
}
