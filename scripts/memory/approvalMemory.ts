import { ApprovalRecord, CritiqueResult } from '../types';
import { appendApproval } from './memoryStore';
import { randomUUID } from 'crypto';

export async function recordApproval(
  intent: string,
  critiqueResult: CritiqueResult,
  humanFeedback?: string
): Promise<void> {
  const record: ApprovalRecord = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    intent,
    critiqueResult,
    humanFeedback,
  };

  await appendApproval(record);
}
